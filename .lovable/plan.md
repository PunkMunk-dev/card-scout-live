

# Pull-to-Refresh on Mobile

## Approach
Create a reusable `PullToRefresh` wrapper component that uses touch events (`touchstart`, `touchmove`, `touchend`) to detect a downward pull gesture when scrolled to the top. Show a visual indicator (spinner + pull distance feedback), then trigger a refresh callback. Only active on mobile (hidden on `sm:` and up).

No third-party library needed — pure touch event handling keeps the bundle small.

## Files

### 1. New: `src/components/PullToRefresh.tsx`
- Wraps children in a container
- Tracks touch delta; shows a pull indicator (arrow that rotates to spinner at threshold)
- Props: `onRefresh: () => Promise<void>`, `children`, `disabled?: boolean`
- Only activates when `window.scrollY === 0` and pull direction is downward
- Uses `translateY` on the content container to visually shift it down during pull
- Hides on `sm:` screens via media query check (`useIsMobile`)

### 2. Edit: `src/components/tcg-lab/TerminalView.tsx`
- Expose a `refetch` from `useInfiniteQuery` (already available)
- Wrap the root `<div>` with `<PullToRefresh onRefresh={refetch}>`

### 3. Edit: `src/components/sports-lab/EbayResultsPanel.tsx`
- Wrap the root content with `<PullToRefresh onRefresh={retry}>`
- `retry` already exists and re-triggers the search

### 4. Edit: `src/index.css`
- Add a small `@keyframes pullSpin` animation for the refresh spinner

## Behavior
- Pull down ~60px from top of page → indicator appears with arrow icon
- Release above threshold → snaps back, no refresh
- Release at/past threshold → spinner appears, calls `onRefresh`, snaps back when promise resolves
- Desktop: component renders children directly, no touch handling

