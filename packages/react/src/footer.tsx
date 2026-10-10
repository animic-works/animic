import { footer } from "@animic/styled-system/recipes";
import { domProps, type CommonProps } from "./dom";
export function Footer({ ref, ...props }: CommonProps<HTMLElement>) {
  return (
    <footer {...domProps(props)} ref={ref} className={footer()}>
      {props.children}
    </footer>
  );
}
