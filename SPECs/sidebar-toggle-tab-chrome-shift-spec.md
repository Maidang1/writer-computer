# Sidebar Toggle Tab Chrome Shift

## Problem

Toggling the sidebar makes the tab chrome snap horizontally. The tab strip lives inside the editor area, whose left edge moves as the sidebar width animates, while the tab strip also switches its own left padding between expanded and collapsed sidebar states.

## Goal

- Keep the sidebar toggle clear of the tab chrome when the sidebar is collapsed.
- Move the tab chrome smoothly between expanded and collapsed positions.
- Avoid changing editor pane layout or tab behavior.

## Approach

Render the tab chrome from the app layout as a root-level overlay. The overlay's `left` value transitions between the expanded sidebar edge plus chrome padding and the collapsed safe inset that clears the macOS traffic lights and sidebar toggle. The tab strip itself keeps only vertical padding, so it no longer performs a second state-dependent horizontal jump.
