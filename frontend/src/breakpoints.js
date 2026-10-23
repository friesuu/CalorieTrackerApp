// The layout breakpoints (design/DESIGN.md, section 10), for useMediaQuery.
// CSS can't use variables inside media queries, so App.css writes the same two widths.
//   below 720px:   phone. The menu button opens the navigation as a drawer; sheets come up from the bottom.
//   720 to 1023px: tablet. The sidebar is always on screen; sheets open in the middle.
//   1024px and up: desktop. Wider sidebar, and Today shows the food library beside the log.
export const TABLET_UP = '(min-width: 720px)';
export const DESKTOP_UP = '(min-width: 1024px)';
