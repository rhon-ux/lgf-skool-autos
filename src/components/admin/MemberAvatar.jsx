import { makeAvatar } from "./membersData";
import { roleColor } from "./utils";

export default function MemberAvatar({ member, className = "", role }) {
  const initial = makeAvatar(member);
  const color = roleColor(role ?? member?.role);
  const classes = ["member-avatar", className].filter(Boolean).join(" ");

  if (member?.avatarUrl) {
    return (
      <img
        src={member.avatarUrl}
        alt=""
        className={`${classes} member-avatar--img`}
        style={{ "--role-color": color }}
      />
    );
  }

  return (
    <div className={classes} style={{ "--role-color": color }}>
      {initial}
    </div>
  );
}
