require("dotenv").config();
const { BrevoClient } = require("@getbrevo/brevo");
const moment = require("moment");

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
  timeoutInSeconds: 30,
  maxRetries: 3
});

const FROM = { name: "Radiant Hyve", email: "juniord.dj88@gmail.com" };
const YEAR = new Date().getFullYear();

// ── Shared HTML wrapper ───────────────────────────────────────────────────────
const wrap = (accentColor, icon, headline, bodyText, rows) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.08);">
    <div style="background:${accentColor};padding:28px 24px;text-align:center;">
      <div style="font-size:42px;line-height:1;">${icon}</div>
      <h1 style="color:#fff;margin:10px 0 0;font-size:20px;font-weight:700;">${headline}</h1>
    </div>
    <div style="padding:24px;">
      <p style="color:#444;font-size:15px;line-height:1.7;margin:0 0 18px;">${bodyText}</p>
      ${rows.length ? `
      <table style="width:100%;border-collapse:collapse;">
        ${rows.map(([k, v]) => `
        <tr>
          <td style="padding:9px 0;color:#777;font-size:13px;border-bottom:1px solid #f0f0f0;width:42%;">${k}</td>
          <td style="padding:9px 0;color:#222;font-size:13px;font-weight:600;border-bottom:1px solid #f0f0f0;">${v}</td>
        </tr>`).join("")}
      </table>` : ""}
    </div>
    <div style="background:#fafafa;padding:14px;text-align:center;border-top:1px solid #eee;">
      <p style="color:#bbb;font-size:11px;margin:0;">
        © ${YEAR} Radiant Hyve &nbsp;·&nbsp; This is an automated message, please do not reply.
      </p>
    </div>
  </div>
</body>
</html>`;

// ── Core send utility ─────────────────────────────────────────────────────────
const send = (to, subject, html) =>
  brevo.transactionalEmails.sendTransacEmail({
    subject,
    htmlContent: html,
    sender: FROM,
    to: [{ email: to }]
  });

// ── 1. Route assigned → driver ────────────────────────────────────────────────
const sendRouteAssignedEmail = ({ driverEmail, driverName, routeName, routeType, scheduledTime }) =>
  send(
    driverEmail,
    `New Route Assigned: ${routeName}`,
    wrap(
      "#2563EB", "🚌", "New Route Assigned",
      `Hi <b>${driverName}</b>, a new route has been assigned to you. Please review the details and be ready at the scheduled time.`,
      [
        ["Route", routeName],
        ["Type", (routeType || "").replace(/_/g, " ")],
        ["Scheduled Time", moment(scheduledTime).format("ddd, MMM Do YYYY [at] h:mm A")]
      ]
    )
  );

// ── 2. Route started → admin ──────────────────────────────────────────────────
const sendRouteStartedEmail = ({ adminEmail, adminName, driverName, routeName, vehicleName, studentsCount, startedAt }) =>
  send(
    adminEmail,
    `Route Started: ${routeName}`,
    wrap(
      "#16A34A", "🟢", "Route Started",
      `Hi <b>${adminName}</b>, <b>${driverName}</b> has started route <b>${routeName}</b>. Live tracking is now active.`,
      [
        ["Route", routeName],
        ["Driver", driverName],
        ["Vehicle", vehicleName || "—"],
        ["Students", String(studentsCount)],
        ["Started At", moment(startedAt).format("h:mm A")]
      ]
    )
  );

// ── 3. Student picked up → parent ─────────────────────────────────────────────
const sendStudentPickedUpEmail = ({ parentEmail, parentName, studentName, routeName, pickedUpAt }) =>
  send(
    parentEmail,
    `${studentName} Has Been Picked Up`,
    wrap(
      "#16A34A", "✅", "Your Child Has Been Picked Up",
      `Hi <b>${parentName}</b>, <b>${studentName}</b> has been picked up and is on the way. You will receive another notification once they are safely dropped off.`,
      [
        ["Student", studentName],
        ["Route", routeName],
        ["Picked Up At", moment(pickedUpAt).format("h:mm A")]
      ]
    )
  );

// ── 4a. Student absent → parent ───────────────────────────────────────────────
const sendStudentAbsentParentEmail = ({ parentEmail, parentName, studentName, routeName, stopName }) =>
  send(
    parentEmail,
    `${studentName} Was Not at the Pickup Stop`,
    wrap(
      "#DC2626", "⚠️", "Child Not Found at Stop",
      `Hi <b>${parentName}</b>, the driver was unable to find <b>${studentName}</b> at the scheduled pickup stop. If this is unexpected, please contact the school immediately.`,
      [
        ["Student", studentName],
        ["Route", routeName],
        ["Stop", stopName || "—"]
      ]
    )
  );

// ── 4b. Student absent → admin ────────────────────────────────────────────────
const sendStudentAbsentAdminEmail = ({ adminEmail, adminName, studentName, routeName, stopName, driverName }) =>
  send(
    adminEmail,
    `Absence Alert: ${studentName} on ${routeName}`,
    wrap(
      "#DC2626", "⚠️", "Student Absent at Stop",
      `Hi <b>${adminName}</b>, <b>${studentName}</b> was marked absent at their pickup stop on route <b>${routeName}</b>. An exception has been logged.`,
      [
        ["Student", studentName],
        ["Route", routeName],
        ["Stop", stopName || "—"],
        ["Driver", driverName]
      ]
    )
  );

// ── 5a. Pickup skipped → parent ───────────────────────────────────────────────
const sendStudentSkippedParentEmail = ({ parentEmail, parentName, studentName, routeName, skipReason }) =>
  send(
    parentEmail,
    `${studentName}'s Pickup Was Skipped`,
    wrap(
      "#EA580C", "⏭️", "Child Pickup Was Skipped",
      `Hi <b>${parentName}</b>, <b>${studentName}</b>'s pickup was skipped on today's route. Please contact the school for more information.`,
      [
        ["Student", studentName],
        ["Route", routeName],
        ["Reason", skipReason || "Not provided"]
      ]
    )
  );

// ── 5b. Pickup skipped → admin ────────────────────────────────────────────────
const sendStudentSkippedAdminEmail = ({ adminEmail, adminName, studentName, routeName, skipReason, driverName }) =>
  send(
    adminEmail,
    `Pickup Skipped: ${studentName} on ${routeName}`,
    wrap(
      "#EA580C", "⏭️", "Student Pickup Skipped",
      `Hi <b>${adminName}</b>, <b>${driverName}</b> skipped the pickup for <b>${studentName}</b> on route <b>${routeName}</b>.`,
      [
        ["Student", studentName],
        ["Route", routeName],
        ["Driver", driverName],
        ["Reason", skipReason || "Not provided"]
      ]
    )
  );

// ── 6. Student dropped off → parent ──────────────────────────────────────────
const sendStudentDroppedOffEmail = ({ parentEmail, parentName, studentName, routeName, recipientName, droppedOffAt }) =>
  send(
    parentEmail,
    `${studentName} Has Been Safely Dropped Off`,
    wrap(
      "#2563EB", "🏠", "Child Safely Dropped Off",
      `Hi <b>${parentName}</b>, <b>${studentName}</b> has been safely dropped off to <b>${recipientName}</b>.`,
      [
        ["Student", studentName],
        ["Route", routeName],
        ["Handed To", recipientName],
        ["Time", moment(droppedOffAt).format("h:mm A")]
      ]
    )
  );

// ── 7. Route completed → admin ────────────────────────────────────────────────
const sendRouteCompletedEmail = ({ adminEmail, adminName, routeName, driverName, studentsCount, completedAt }) =>
  send(
    adminEmail,
    `Route Completed: ${routeName}`,
    wrap(
      "#16A34A", "✅", "Route Completed Successfully",
      `Hi <b>${adminName}</b>, route <b>${routeName}</b> has been completed. The driver confirmed the mandatory vehicle safety check.`,
      [
        ["Route", routeName],
        ["Driver", driverName],
        ["Students", String(studentsCount)],
        ["Completed At", moment(completedAt).format("h:mm A")],
        ["Vehicle Check", "Confirmed ✓"]
      ]
    )
  );

// ── 8. Transport exception → admin ────────────────────────────────────────────
const sendTransportExceptionEmail = ({ adminEmail, adminName, exceptionType, description, routeName, severity }) => {
  const color = severity === "critical" ? "#7F1D1D" : severity === "high" ? "#DC2626" : "#EA580C";
  const icon = severity === "critical" ? "🚨" : "⚠️";
  return send(
    adminEmail,
    `[${(severity || "").toUpperCase()}] Transport Exception on ${routeName}`,
    wrap(
      color, icon, `Transport Exception — ${(severity || "").toUpperCase()}`,
      `Hi <b>${adminName}</b>, a <b>${severity}</b>-severity transport exception has been logged on route <b>${routeName}</b>. Please review and take action in the admin dashboard.`,
      [
        ["Route", routeName],
        ["Exception Type", (exceptionType || "").replace(/_/g, " ")],
        ["Severity", (severity || "").toUpperCase()],
        ["Details", description]
      ]
    )
  );
};

module.exports = {
  sendRouteAssignedEmail,
  sendRouteStartedEmail,
  sendStudentPickedUpEmail,
  sendStudentAbsentParentEmail,
  sendStudentAbsentAdminEmail,
  sendStudentSkippedParentEmail,
  sendStudentSkippedAdminEmail,
  sendStudentDroppedOffEmail,
  sendRouteCompletedEmail,
  sendTransportExceptionEmail
};
