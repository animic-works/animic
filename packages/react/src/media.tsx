import type { ReactNode } from "react";
import { media } from "@animic/styled-system/recipes";
export interface MediaProps {
  size?: "fluid" | "preview";
  appearance?: "standard" | "inverse" | "accented";
  presentation?: "standard" | "captioned";
  src: string;
  alt: string;
  aspect?: "square" | "portrait" | "landscape";
  fit?: "cover" | "contain";
  label?: ReactNode;
  caption?: ReactNode;
  decoration?: ReactNode;
  onOpen?: () => void;
  entering?: boolean;
}
export function Media(props: MediaProps) {
  const c = media({
    size: props.size,
    aspect: props.aspect,
    fit: props.fit,
    presentation: props.presentation,
    appearance: props.appearance,
  });
  return (
    <div className={c.root}>
      <figure className={c.viewport}>
        <img
          className={c.image}
          src={props.src}
          alt={props.alt}
          data-entering={props.entering || undefined}
        />
        {props.decoration && (
          <div className={c.decoration} aria-hidden="true">
            {props.decoration}
          </div>
        )}
        {props.label && <div className={c.label}>{props.label}</div>}
        {props.caption && <figcaption className={c.caption}>{props.caption}</figcaption>}
      </figure>
      {props.onOpen && (
        <button
          type="button"
          className={c.trigger}
          aria-label={`${props.alt}を拡大`}
          onClick={props.onOpen}
        />
      )}
    </div>
  );
}

export function MediaPlaceholder({
  aspect = "portrait",
  children,
  label,
  description,
  footer,
}: {
  aspect?: MediaProps["aspect"];
  children: ReactNode;
  label: string;
  description?: string;
  footer?: ReactNode;
}) {
  const c = media({ aspect });
  return (
    <div className={c.root} role="img" aria-label={label}>
      <div className={c.viewport}>
        <div className={c.placeholder}>
          {children}
          {description && <span className={c.description}>{description}</span>}
        </div>
        {footer && <div className={c.footer}>{footer}</div>}
      </div>
    </div>
  );
}
