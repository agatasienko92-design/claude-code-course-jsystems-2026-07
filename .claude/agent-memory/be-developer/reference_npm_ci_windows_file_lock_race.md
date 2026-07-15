---
name: reference-npm-ci-windows-file-lock-race
description: On this Windows VM, a backgrounded `npm ci` that's still running will collide with a second foreground `npm ci` on the same node_modules, producing ENOTEMPTY/EPERM rmdir errors that look like a broken install.
metadata:
  type: reference
---

Running `npm ci` via Bash with `run_in_background: true` and then, before
it finishes, running `npm ci` again in the foreground (e.g. because the
first call appeared to hang past the tool timeout) causes both processes to
delete/rewrite `node_modules` concurrently. Symptom: repeated
`npm error code ENOTEMPTY` / `EPERM` on `rmdir` for deeply nested paths
(`next/dist/...`, `es-abstract/...`), even after manually `rm -rf
node_modules` — because the background process keeps recreating files
while the foreground one is mid-delete.

**How to apply:** if a package-install command was backgrounded, wait for
its actual completion notification (or poll `ls node_modules | wc -l`
stabilizing across repeated checks) before starting another install command
against the same `node_modules`. Don't just assume a background command
died because the shell tool moved it to background after a timeout — check
for its completion notification later in the session. If you already
triggered the race and see ENOTEMPTY loops, the fix is: let any stray
background installs finish, `rm -rf node_modules` fully (may take 2-3
attempts to clear file-lock stragglers), then run one clean `npm ci`.
