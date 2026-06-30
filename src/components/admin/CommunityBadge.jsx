import { communityType } from "./utils";

export default function CommunityBadge({ community }) {
  const type = communityType(community);
  const isSingleLine = !community.subtitle;

  return (
    <span className={`community-badge community-badge--${type}${isSingleLine ? " community-badge--single" : ""}`}>
      {isSingleLine ? (
        <span className="community-badge-line">{community.title}</span>
      ) : (
        <>
          <span className="community-badge-line">{community.title}</span>
          <span className="community-badge-line community-badge-line--sub">{community.subtitle}</span>
        </>
      )}
    </span>
  );
}
