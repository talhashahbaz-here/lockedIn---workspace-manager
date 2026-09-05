import io

def patch(path, pairs):
    with io.open(path, 'r', encoding='utf-8') as f:
        s = f.read()
    missed = []
    for old, new in pairs:
        if old not in s:
            missed.append(old[:70])
        s = s.replace(old, new)
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(s)
    print('--- ' + path)
    for m in missed:
        print('  MISS: ' + m.encode('ascii', 'replace').decode())

patch('src/components/ConfirmDialog/index.jsx', [
    ("title = 'you sure about this?'", "title = 'Are you sure?'"),
    ("body = 'this action cannot be undone. and we mean it.'", "body = 'This action cannot be undone.'"),
    ("confirmText = 'yeet it'", "confirmText = 'Delete'"),
    ("cancelText = 'nah, i bugged'", "cancelText = 'Cancel'"),
])

patch('src/components/TaskComposer/index.jsx', [
    ('eyebrow="new task \u2703 n" title="spawn a task"', 'eyebrow="new task \u00b7 N" title="New task"'),
    ('placeholder="fix the thing that breaks the other thing"', 'placeholder="What needs to be done?"'),
    ('placeholder="details, links, lore\u2026"', 'placeholder="Add more details\u2026"'),
    ("priority: 'mid',", "priority: 'medium',"),
    ('nah\n          </button>\n          <button type="submit" className="btn btn-accent">\n            <Plus size={15} strokeWidth={2.5} /> spawn it', 'Cancel\n          </button>\n          <button type="submit" className="btn btn-accent">\n            <Plus size={15} strokeWidth={2.5} /> Create task'),
    ('toastPushed({ text: `"${task.title}" spawned. go touch it` })', 'toastPushed({ text: `"${task.title}" created` })'),
])

patch('src/components/BoardView/index.jsx', [
    ("{drag ? 'drop it here \ud83d\udc40' : 'crickets'}", "{drag ? 'Drop tasks here' : 'No tasks'}"),
    ("priority: 'mid',", "priority: 'medium',"),
    ("title: `new lane ${project.columns.length + 1}`", "title: `new column ${project.columns.length + 1}`"),
    ("body: count\n        ? `${count} task(s) in it will bounce to the first remaining column. they will be fine.`\n        : 'the column is empty. it will not be missed.',", "body: count\n        ? `${count} task(s) in it will move to the first remaining column.`\n        : 'This column is empty.',"),
])

patch('src/components/TaskDetail/index.jsx', [
    ("'no comments. the silence is deafening.'", "'No comments yet.'"),
    ("'no files. suspiciously minimal.'", "'No files attached yet.'"),
    ("'no activity yet. be the change.'", "'No activity yet.'"),
    ('title: `yeet "${task.title}"?', 'title: `Delete "${task.title}"?'),
    ("body: 'the task and its comments will be deleted. undo exists, but let us not test it.',", "body: 'The task and its comments will be deleted. You can undo from the toast.',"),
    ("confirmText: 'yeet it',", "confirmText: 'Delete',"),
    ("toastPushed({ text: 'task duplicated. twice the glory' })", "toastPushed({ text: 'Task duplicated' })"),
    ('toastPushed({ text: `"${st.title}" is a real task now. proud of it` })', "toastPushed({ text: 'Subtask promoted to a task' })"),
    ('placeholder="context, links, lore\u2026"', 'placeholder="Add details\u2026"'),
    ('its comments stay behind (with the ship).', 'Its comments will be removed.'),
    ('placeholder="drop a comment\u2026 @ to mention someone"', 'placeholder="Write a comment\u2026 @ to mention someone"'),
    ("['design', 'frontend', 'backend', 'copy', 'research', 'chore', 'bug', 'feature', 'vibe-check', 'asap', 'meetings', 'content'].map", "['design', 'frontend', 'backend', 'research', 'bug', 'content', 'asap', 'meetings', 'planning'].map"),
])

patch('src/components/ListView/index.jsx', [
    ("nothing here. it is giving\u2026 zero tasks.", "No tasks match the current filters."),
])

patch('src/components/TaskCard/index.jsx', [
    ("{overdue ? 'cooked \u00b7 ' : today ? 'today \u00b7 ' : ''}", "{overdue ? 'overdue \u00b7 ' : today ? 'today \u00b7 ' : ''}"),
])

patch('src/components/CommandPalette/index.jsx', [
    ("nothing found. it is giving void.", "No results found."),
    ("label: `go ${theme === 'light' ? 'dark' : 'light'} mode`", "label: `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`"),
    ("label: `${npcMode ? 'mute' : 'unmute'} the npc coworkers`", "label: `${npcMode ? 'Mute' : 'Unmute'} simulated teammates`"),
    ("label: 'fake a sync'", "label: 'Sync now (simulated)'"),
])

patch('src/pages/Dashboard/Home/index.jsx', [
    ('title="inbox zero energy"', 'title="Nothing assigned to you"'),
    ('sub="either you are very efficient or very avoidant."', 'sub="Nothing is assigned to you right now."'),
    ("'then you are officially locked in.'", "'You are all set.'"),
    ("'checklist hidden. you clearly got this'", "'Checklist hidden'"),
    ("'spawn your first project'", "'Create your first project'"),
    ("'ship one thing'", "'Complete a task'"),
    ('<h3>\ud83d\udccb on your plate</h3>', '<h3>My tasks</h3>'),
    ("tasks in the fire", "Active tasks"),
    ("shipped \ud83d\ude80", "Completed"),
    ("overdue (cooked)", "Overdue"),
])

patch('src/pages/Dashboard/Home/Hero.jsx', [
    ("hour < 12 ? 'gm' : hour < 18 ? 'locked in hours' : 'evening grind'", "hour < 12 ? 'good morning' : hour < 18 ? 'good afternoon' : 'good evening'"),
    ("hour < 5 ? 'still up?' :", "hour < 5 ? 'working late?' :"),
])

patch('src/pages/Dashboard/Projects/index.jsx', [
    ("title={isEdit ? 'tune the project' : 'cook up a project'}", "title={isEdit ? 'Edit project' : 'New project'}"),
    ("toastPushed({ text: 'project updated. very professional' })", "toastPushed({ text: 'Project updated' })"),
    ('body: \'it goes read-only and hides from the main grid. nothing is deleted. very reversible.\',', 'body: \'Archived projects become read-only and are hidden from the main list. You can restore them anytime.\','),
    ('toastPushed({ text: `"${p.name}" revived. welcome back king` })', 'toastPushed({ text: `"${p.name}" restored` })'),
    ('body: `${taskCount} task(s) and all comments go with it. this cannot be undone without regrets.`,', 'body: `${taskCount} task(s) and all comments will be deleted. This cannot be undone.`,'),
    ('<p className="page-sub">the containers of ambition. keep them small enough to finish.</p>', '<p className="page-sub">Group your work into projects.</p>'),
    ("sub={showArchived ? 'nothing retired. everything is still in the game.' : 'spawn your first project, pick a template, assign the squad.'}", "sub={showArchived ? 'No archived projects.' : 'Create your first project, pick a template, and assign members.'}"),
    ('title="project not found" sub="it may have been deleted. projects have feelings too."', 'title="Project not found" sub="It may have been deleted."'),
    ('you can work tasks but not create/archive/delete projects. the borders are real.', 'you can work on tasks, but only admins and owners can create, archive or delete projects.'),
])

patch('src/pages/Dashboard/Todos/index.jsx', [
    ("read-only mode ({perms.role}) — viewers can look, not touch", "Read-only mode ({perms.role})"),
])

patch('src/pages/Dashboard/Todos/All.jsx', [
    ('every deadline in the workspace, on one grid.', 'All deadlines in this workspace, on one grid.'),
    ("sub=\"it may have been deleted. projects have feelings too.\"", "sub=\"It may have been deleted.\""),
    ("'no description. it prefers to remain an enigma.'", "'No description.'"),
    ("every task across ${projects.length} project(s) in ${ws?.name ?? 'the workspace'}.", "all tasks across ${projects.length} project(s) in ${ws?.name ?? 'this workspace'}."),
])

patch('src/pages/Dashboard/Todos/Add.jsx', [
    ("'the composer should be open right now. if it is not, hit escape and use the button like everyone else.'", "'The composer should be open right now.'"),
    ("'you need at least one project before tasks can exist. facts.'", "'Create a project first \u2014 tasks live inside projects.'"),
])

patch('src/pages/Dashboard/Todos/Edit.jsx', [
    ('sub="wrong id, deleted task, or the url goblin struck again."', 'sub="The task may have been deleted, or the link is wrong."'),
    ('the task editor is open in a modal. close it to head back to the project.', 'The task editor is open in a modal. Close it to head back to the project.'),
])

patch('src/components/BulkBar/index.jsx', [
    ("body: 'gone. all of them. the undo button will be right there, but still.',", "body: 'All selected tasks will be deleted. You can undo from the toast.',"),
    ("confirmText: 'delete them all',", "confirmText: 'Delete all',"),
])

patch('src/pages/Dashboard/Users/index.jsx', [
    ("{members.length} human(s), {projects.length} active project(s).\n            roles decide who can actually do things.", "{members.length} members \u00b7 {projects.length} active projects.\n            Roles decide who can edit and manage."),
    ('title="nobody here" sub="ghost workspace. invite some mock users to make it a party."', 'title="No members" sub="Invite some mock users to get started."'),
    ("'everyone is already in this workspace. popular.'", "'Everyone is already in this workspace.'"),
    ("'only the owner can switch roles. the hierarchy is real.'", "'Only the owner can change roles.'"),
    ("'demoting yourself? bold. not today.'", "'You cannot change your own role.'"),
    ("'only the owner can remove members. boundaries.'", "'Only the owner can remove members.'"),
    ("body: 'they lose access instantly. their assigned tasks stay, just unowned emotionally.',", "body: 'They will lose access immediately. Their assigned tasks remain.',"),
    ("'simulated client-side. vibes enforced.'", "'Simulated client-side.'"),
    ("ui from the other side. viewers get the full museum tour.", "UI from another role's perspective."),
    ('eyebrow="invite (fake)" title="pull someone in"', 'eyebrow="invite (simulated)" title="Add a member"'),
    ("pick a mock user\u2026", "Pick a user\u2026"),
])

patch('src/pages/Activity/index.jsx', [
    ('the group chat, but it is a work log. filter it like a detective.', 'Everything that happened in this workspace, filterable by person and type.'),
    ('sub="suspiciously quiet. go move a task around and come back."', 'sub="No activity matches these filters."'),
])

patch('src/pages/Notifications/index.jsx', [
    ("{unread ? `${unread} unread. the pings demand attention.` : 'all caught up. unbothered. moisturized.'}", "{unread ? `${unread} unread notification(s).` : 'You are all caught up.'}"),
    ('sub="nobody needs you right now. use this time wisely (nap)."', 'sub="No notifications yet."'),
    ("dispatch(toastPushed({ text: 'notification tray decluttered' }));", "dispatch(toastPushed({ text: 'Notifications cleared' }));"),
    ("text: `pings for \"${key}\" ${notifPrefs[key] ? 'off. silence.' : 'on. stay posted.'}`", "text: `Notifications for \"${key}\" ${notifPrefs[key] ? 'off' : 'on'}`"),
    ("['assigned', 'someone assigns you a task'],", "['assigned', 'Someone assigns you a task'],"),
    ("['mentioned', 'someone @s you in a comment'],", "['mentioned', 'Someone @mentions you in a comment'],"),
    ("['due', 'a task of yours is due soon (checked every few minutes)'],", "['due', 'One of your tasks is due soon (checked every few minutes)'],"),
    ("['npc', 'the npc coworkers ping you with their fake updates'],", "['team', 'A simulated teammate @mentions you'],"),
    ("const TYPE_TAG = { assigned: 'tag-blue', mentioned: 'tag-pink', due: 'tag-yellow', npc: 'tag-accent' };", "const TYPE_TAG = { assigned: 'tag-blue', mentioned: 'tag-pink', due: 'tag-yellow', team: 'tag-accent' };"),
    ('\ud83d\udd14 ping preferences', 'Notification preferences'),
    ("the bell in the topbar shows the same unread count. click a notification to jump to the task.", "The bell in the topbar shows the same unread count. Click a notification to open its task."),
])

patch('src/pages/Dashboard/Settings/index.jsx', [
    ("tune the app to your exact level of unhinged.", "Preferences for your account and workspace."),
    ("'profile updated. looking sharp'", "'Profile updated'"),
    ("light is brutal. dark is sneaky brutal.", "Applies immediately and is remembered."),
    ("npc coworkers\n", "Simulated teammates\n"),
    ("simulated teammates comment, move cards and stay \"online\". turn them off for a quiet life.", "Demo teammates occasionally comment and move cards so the workspace feels live."),
    ("simulated network flakiness", "Simulated network failures"),
    ("occasionally fakes a failed save so you can watch optimistic updates roll back. nerdy but fun.", "Occasionally fakes a failed save so optimistic updates visibly roll back."),
    ("export workspace as json", "Export workspace as JSON"),
    ("one file: workspace + projects + tasks + comments. keep it somewhere safe.", "Downloads a JSON file with this workspace's projects, tasks and comments."),
    ("validated before anything happens. invalid files get roasted, not loaded.", "Files are validated before anything is imported."),
    ("manual sync (theatrical)", "Sync (simulated)"),
    ("fakes a round trip to a server that does not exist. satisfying regardless.", "Fakes a round trip to a server \u2014 useful for demoing the sync state."),
    ("'synced. nothing changed. still satisfying.'", "'Sync complete.'"),
    ("the app watches navigator.onLine. go offline (devtools \u2192 network) to see the banner.", "Watches navigator.onLine. Go offline (DevTools \u2192 Network) to see the banner."),
    ("the vibe remains intact.", "Your data is restored exactly as you left it."),
    ("irreversible-ish. everything inside gets shredded.", "Everything inside this workspace will be deleted."),
    ("reset the whole app", "Reset all app data"),
    ("wipes all local data (IndexedDB) and reseeds the demo universe. logins survive.", "Wipes all local data (IndexedDB) and restores the original demo data. Your login survives."),
    ("title: `nuke ALL local data?`,", "title: 'Reset all local data?',"),
    ("body: 'everything you built gets wiped and the demo data re-seeds. there is no undo for this one. think.',", "body: 'All local data is wiped and the demo data is restored. This cannot be undone.',"),
    ("confirmText: 'nuke it all',", "confirmText: 'Reset everything',"),
    ("quick profile switch (multi-user sim)", "Switch profile (multi-user demo)"),
    ("hop into another mock user to demo roles & permissions instantly.", "Instantly demo roles and permissions as another mock user."),
    ("email (locked \u2014 it is your login)", "Email (used for login \u2014 read-only)"),
])

patch('src/pages/Dashboard/index.jsx', [
    ("'home base'", "'Home'"),
    ("'the squad'", "'Team'"),
    ("? 'coworkers online' : 'muted'", "? 'teammates online' : 'muted'"),
    ("title={npcMode ? 'npc coworkers are vibing' : 'npc coworkers muted'}", "title={npcMode ? 'Simulated teammates active' : 'Simulated teammates muted'}"),
    ("'cannot delete the last workspace. chaos needs a home.'", "'You need at least one workspace.'"),
    ("toastPushed({ text: 'workspace founded. a new era fr' })", "toastPushed({ text: 'Workspace created' })"),
    ('title="found a new era"', 'title="New workspace"'),
    ('placeholder="the grind society"', 'placeholder="e.g. Acme Inc"'),
    ('title="rebrand the workspace"', 'title="Workspace settings"'),
    ('. for real.`,', '.`,'),
    ('will be gone forever', 'will be deleted'),
    ("you are in zero workspaces", "No workspace yet"),
    ('back to login</Link>\n          </div>\n        </div>\n        <Toaster />', 'Set up my workspace</button>\n          </div>\n        </div>\n        <Toaster />'),
    ("{ROLE_VIBES[role] ?? 'off the grid'}", "{ROLE_VIBES[role] ?? 'unknown'}"),
    ("title=\"fake a sync\"", "title=\"Sync (simulated)\""),
    ("'sync complete. everything was already fine, but it feels official now'", "'Sync complete.'"),
    ("title: `delete \"${ws.name}\"?`,", "title: `Delete \"${ws.name}\"?`,"),
    ("confirmText: 'delete workspace',", "confirmText: 'Delete workspace',"),
])

patch('src/components/Onboarding/index.jsx', [
    ("lockedin \u2703 welcome,", "LockedIn \u00b7 Welcome,"),
    ("first, name your space.", "Name your workspace."),
    ("a workspace holds your projects and your people. you are the owner \u2014 you can rename it whenever.", "A workspace holds your projects and your team. You are the owner and can rename it anytime."),
    ("vibe (emoji)", "Emoji"),
    ("next: first project \u2192", "Next: first project \u2192"),
    ("now, one project.", "Now, one project."),
    ("pick a template and we pre-fill the tasks. you can skip the name and do this later.", "Pick a template and we will pre-fill starter tasks. The name is optional."),
    ("take me in \u2703", "Finish"),
    ('placeholder="the grind society"', 'placeholder="e.g. Acme Inc"'),
    ("text: 'workspace ready. welcome to the grind'", "text: 'Workspace ready. Welcome aboard!'"),
    ("skip for now", "Skip for now"),
])
