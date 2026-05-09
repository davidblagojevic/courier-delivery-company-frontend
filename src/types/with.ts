export type WithChildren<T = Record<string, unknown>> = T & {
  children?: React.ReactNode;
};

export type WithClassName<T = Record<string, unknown>> = T & {
  className?: string;
};

export type WithOnClick<T = Record<string, unknown>> = T & {
  onClick?: React.MouseEventHandler<HTMLElement>;
};
