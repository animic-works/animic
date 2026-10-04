import { Avatar as ArkAvatar } from "@ark-ui/react/avatar";
import { avatar } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface AvatarProps extends Omit<CommonProps, "children"> {
  name: string;
  src?: string;
}
export function Avatar({ ref, ...props }: AvatarProps) {
  const classes = avatar();
  return (
    <ArkAvatar.Root
      {...domProps(props)}
      ref={ref}
      className={classes.root}
      role="img"
      aria-label={props.name}
    >
      <ArkAvatar.Fallback className={classes.fallback} aria-hidden="true">
        {Array.from(props.name).slice(0, 2).join("")}
      </ArkAvatar.Fallback>
      {props.src && <ArkAvatar.Image src={props.src} alt="" className={classes.image} />}
    </ArkAvatar.Root>
  );
}
