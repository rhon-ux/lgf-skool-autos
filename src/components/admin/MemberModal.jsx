import { useRef } from "react";
import {
  COMMUNITY_OPTIONS,
  TIER_OPTIONS,
  STATUS_OPTIONS,
  LEVEL_OPTIONS,
  ROLE_OPTIONS,
  MEMBERSHIP_OPTIONS,
  isMemberFormValid,
} from "./membersData";
import MemberAvatar from "./MemberAvatar";

const TEXT_FIELDS = [
  { label: "Full name", key: "name", type: "text" },
  { label: "Email", key: "email", type: "email" },
];

export default function MemberModal({ title, member, onChange, onClose, onSubmit, submitLabel, placeholders = {} }) {
  const fileInputRef = useRef(null);
  const canSubmit = isMemberFormValid(member);

  const previewMember = {
    name: member.name,
    firstName: member.name?.trim().split(/\s+/)[0] ?? "",
    role: member.role,
    avatarUrl: member.avatarUrl || null,
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    onChange(p => ({ ...p, avatarUrl: previewUrl, avatarFile: file }));
    e.target.value = "";
  };

  const handleRemoveAvatar = () => {
    onChange(p => ({ ...p, avatarUrl: "", avatarFile: null }));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <div className="member-avatar-upload">
          <MemberAvatar member={previewMember} className="member-avatar-upload__preview" role={member.role} />
          <div className="member-avatar-upload__actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleAvatarChange}
            />
            <button type="button" className="btn btn-secondary btn-secondary--sm" onClick={() => fileInputRef.current?.click()}>
              {member.avatarUrl ? "Change photo" : "Upload photo"}
            </button>
            {member.avatarUrl && (
              <button type="button" className="btn btn-secondary btn-secondary--sm" onClick={handleRemoveAvatar}>
                Remove
              </button>
            )}
            <p className="member-avatar-upload__hint">JPG, PNG, or WebP · max 2 MB. Otherwise shows first letter of name.</p>
          </div>
        </div>
        {TEXT_FIELDS.map(f => (
          <div key={f.key} className="form-group form-group--sm">
            <label className="form-label form-label--sm">{f.label}</label>
            <input
              type={f.type}
              className="form-input form-input--sm"
              placeholder={placeholders[f.key]}
              value={member[f.key]}
              onChange={e => onChange(p => ({ ...p, [f.key]: e.target.value }))}
            />
          </div>
        ))}
        <div className="modal-grid">
          <div>
            <label className="form-label form-label--sm">Price</label>
            <input
              type="text"
              className="form-input form-input--sm"
              placeholder="$97"
              value={member.price ?? ""}
              onChange={e => onChange(p => ({ ...p, price: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label form-label--sm">Recurring interval</label>
            <input
              type="text"
              className="form-input form-input--sm"
              placeholder="Monthly"
              value={member.recurringInterval ?? ""}
              onChange={e => onChange(p => ({ ...p, recurringInterval: e.target.value }))}
            />
          </div>
        </div>
        <div className="form-group form-group--sm">
          <label className="form-label form-label--sm">Invited by</label>
          <input
            type="text"
            className="form-input form-input--sm"
            placeholder="Referrer name"
            value={member.invitedBy ?? ""}
            onChange={e => onChange(p => ({ ...p, invitedBy: e.target.value }))}
          />
        </div>
        <div className="modal-grid">
          <div>
            <label className="form-label form-label--sm">Community</label>
            <select className="form-select" value={member.communityKey} onChange={e => onChange(p => ({ ...p, communityKey: e.target.value }))}>
              {COMMUNITY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label form-label--sm">Tier</label>
            <select className="form-select" value={member.tier} onChange={e => onChange(p => ({ ...p, tier: e.target.value }))}>
              {TIER_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-grid">
          <div>
            <label className="form-label form-label--sm">Status</label>
            <select className="form-select" value={member.status} onChange={e => onChange(p => ({ ...p, status: e.target.value }))}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label form-label--sm">Level</label>
            <select className="form-select" value={member.level} onChange={e => onChange(p => ({ ...p, level: e.target.value }))}>
              {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-grid">
          <div>
            <label className="form-label form-label--sm">Current Membership</label>
            <select className="form-select" value={member.currentMembership} onChange={e => onChange(p => ({ ...p, currentMembership: e.target.value }))}>
              {MEMBERSHIP_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label form-label--sm">Role</label>
            <select className="form-select" value={member.role} onChange={e => onChange(p => ({ ...p, role: e.target.value }))}>
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary btn-secondary--sm" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary btn-primary--sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
