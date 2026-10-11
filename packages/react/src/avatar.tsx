import { Avatar as ArkAvatar } from "@ark-ui/react/avatar";
import type { ReactNode, MouseEventHandler } from "react";
import { avatar } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
interface AvatarAppearanceProps {
  name: string;
  src?: string;
  fallback?: string;
  palette?:
    | "brand"
    | "pink"
    | "cyan"
    | "yellow"
    | "rose"
    | "sky"
    | "cream"
    | "gray"
    | "green"
    | "violet"
    | "orange"
    | "ink";
  ring?: boolean;
  size?: "standard" | "compact" | "large" | "small" | "fluid" | "fill" | "navigation";
}
type AvatarDecoration =
  | { badge?: ReactNode; status?: never }
  | { badge?: never; status?: "idle" | "busy" | "complete" | "pending" };
export type AvatarProps = Omit<CommonProps, "children"> & AvatarAppearanceProps & AvatarDecoration;
export function Avatar({ ref, ...props }: AvatarProps) {
  const classes = avatar({
    size: props.size,
    palette: props.palette,
    ring: props.ring,
    status: props.status,
  });
  const content = (
    <ArkAvatar.Root
      {...domProps(props)}
      ref={ref}
      className={classes.root}
      role="img"
      aria-label={props.name}
    >
      <ArkAvatar.Fallback className={classes.fallback} aria-hidden="true">
        {props.fallback ?? Array.from(props.name).slice(0, 2).join("")}
      </ArkAvatar.Fallback>
      {props.src && <ArkAvatar.Image src={props.src} alt="" className={classes.image} />}
    </ArkAvatar.Root>
  );
  return props.badge || props.status ? (
    <div className={classes.frame}>
      {content}
      <span className={classes.badge} aria-hidden="true">
        {props.status === "complete" ? (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m3 8 3 3 7-7" />
          </svg>
        ) : (
          props.badge
        )}
      </span>
    </div>
  ) : (
    content
  );
}

export type AvatarButtonProps = Omit<CommonProps<HTMLButtonElement>, "children"> &
  AvatarAppearanceProps &
  AvatarDecoration & {
    label: string;
    indicator?: ReactNode;
    onClick: MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
    selected?: boolean;
  };
export function AvatarButton({
  ref,
  label,
  indicator,
  onClick,
  disabled,
  selected,
  ...props
}: AvatarButtonProps) {
  return (
    <button
      {...domProps(props)}
      ref={ref}
      type="button"
      className={avatar({ size: props.size }).trigger}
      aria-pressed={selected}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Avatar
        name={props.name}
        src={props.src}
        fallback={props.fallback}
        palette={props.palette}
        ring={props.ring}
        size={props.size}
        {...(props.status ? { status: props.status } : { badge: props.badge })}
        aria-hidden="true"
      />
      {indicator && (
        <span className={avatar().indicator} aria-hidden="true">
          {indicator}
        </span>
      )}
    </button>
  );
}
