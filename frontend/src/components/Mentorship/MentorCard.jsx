import React from 'react';
import defaultAvatar from '../../assets/download (7).jpg';
import './Mentorship.css';

const MentorCard = ({ mentor, onView, onMessage }) => {
  // normalize avatar like elsewhere
  let avatarSrc = defaultAvatar;
  if (mentor?.avatar_url) {
    const url = mentor.avatar_url;
    if (/^https?:\/\//i.test(url)) avatarSrc = url;
    else if (url.startsWith('/assets') || url.startsWith('/avatars') || url.includes('download')) avatarSrc = defaultAvatar;
    else avatarSrc = url;
  } else if (mentor?.avatarUrl) {
    avatarSrc = mentor.avatarUrl;
  }

  const rating = Math.round((mentor?.rating || mentor?.avg_rating || 4.6) * 10) / 10;

  return (
    <article className="mentor-card-unique wavy-glass" aria-label={`Mentor ${mentor?.name}`}>
      <div className="mentor-unique-top">
        <img src={avatarSrc} alt={mentor?.name} className="mentor-unique-avatar" />
        <div className="mentor-unique-meta">
          <div className="mentor-unique-title">
            <h3>{mentor?.name}</h3>
            <div className="mentor-rating" title={`${rating} out of 5`}>{'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))} <span className="rating-num">{rating}</span></div>
          </div>
          <div className="mentor-unique-expertise">{mentor?.expertise}</div>
        </div>
      </div>

      <p className="mentor-unique-bio">{mentor?.bio ? mentor.bio.slice(0, 140) + (mentor.bio.length > 140 ? '...' : '') : 'No bio available.'}</p>

      <div className="mentor-unique-bottom">
        <div className="mentor-unique-tags">
          {(mentor?.tags || []).slice(0, 4).map((t, i) => (
            <span key={i} className="mentor-tag mentor-tag-small">{t}</span>
          ))}
        </div>
        <div className="mentor-unique-actions">
          <button className="btn-outline small" onClick={() => onView && onView(mentor)}>View</button>
          <button className="btn-primary small" onClick={() => onMessage && onMessage(mentor)}>Message</button>
        </div>
      </div>
    </article>
  );
};

export default MentorCard;
