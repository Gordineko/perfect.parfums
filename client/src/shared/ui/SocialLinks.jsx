import { socialLinks } from "@shared/config/socialLinks";

const SocialLinks = () => {
  return (
    <ul
      className="social-links"
      aria-label="Social links"
    >
      {socialLinks.map(
        ({ id, href, label, text, Icon }) => (
          <li
            key={id}
            className="social-links__item"
          >
            <a
              className="social-links__link"
              href={href}
              aria-label={label}
              target="_blank"
              rel="noopener noreferrer"
            >
              {Icon ? <Icon /> : text}
            </a>
          </li>
        ),
      )}
    </ul>
  );
};

export default SocialLinks;
