# WCAG 2.2 AA review

Automated Playwright + axe coverage checks public, sign-in, authenticated shell, field PWA, and reporting pages at desktop and mobile projects. Existing semantic landmarks, labelled controls, visible focus, reduced-motion CSS, live status messages, responsive tables, and truthful disabled/download states remain required; violations are blockers rather than allowlisted exceptions.

Manual release review still covers: complete keyboard journeys; focus order/restoration for dialogs; screen-reader labels and announcements; 200% zoom and 320 CSS-pixel reflow; touch targets; error association; contrast in normal, hover, focus, disabled, and high-contrast states; and comprehension of downloadable PDF/CSV controls. Record browser, assistive technology, viewport, result, and issue link. No manual item may be marked passed without observation.

## Phase 6 review record — 2026-10-01

| Evidence                          | Scope                                                                                                                                   | Result                                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Automated axe                     | Public, sign-in, authenticated shell; real RC desktop and Pixel 7 contexts; WCAG 2 A/AA, 2.1 AA, 2.2 AA tags                            | No critical or serious violations in the release gate                                                     |
| Automated responsive/offline      | Real RC field preparation, service-worker control, offline reload, 320px mobile overflow assertion                                      | Passed in the release gate                                                                                |
| Agent-conducted manual inspection | Landing and sign-in keyboard sequence (12 focus moves each), accessibility-tree landmarks/names, 200% zoom equivalent to 320 CSS pixels | Focus remained operable; named structure was present; horizontal overflow was 0 after the root reflow fix |
| Human assistive-technology review | Screen reader/browser combinations and high-contrast modes on an operator device                                                        | Required release-approval activity; not represented as agent evidence                                     |

Automated evidence is not described as a human screen-reader review. Any human finding remains release-blocking until triaged; the record must identify the browser, assistive technology, viewport, issue, and disposition.
