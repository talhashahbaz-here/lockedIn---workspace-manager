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

patch('src/components/BulkBar/index.jsx', [
    ("task(s) yeeted", "task(s) deleted"),
])

patch('src/components/CalendarView/index.jsx', [
    ("drag tasks between days to reschedule. click an empty day to spawn a task on it.", "Drag tasks between days to reschedule. Click an empty day to add a task there."),
])

patch('src/components/BoardView/index.jsx', [
    ("'drop it here \U0001F440' : 'crickets'", "'Drop tasks here' : 'No tasks'"),
])

patch('src/components/TaskComposer/index.jsx', [
    ('title="spawn a task"', 'title="New task"'),
])

patch('src/components/Onboarding/index.jsx', [
    (">take me in \u2733</button>", ">Finish</button>"),
])

patch('src/components/TaskDetail/index.jsx', [
    ("no comments. the silence is deafening.", "No comments yet."),
    ("no files. suspiciously minimal.", "No files attached yet."),
    ("no activity yet. be the change.", "No activity yet."),
])

patch('src/pages/Dashboard/MenuItems.jsx', [
    ("label: 'home base'", "label: 'Home'"),
    ("label: 'the squad'", "label: 'Team'"),
])

patch('src/pages/Dashboard/Settings/index.jsx', [
    ("title: 'nuke ALL local data?',", "title: 'Reset all local data?',"),
    ('<span className="settings-row-title">npc coworkers</span>', '<span className="settings-row-title">Simulated teammates</span>'),
])

patch('src/pages/Notifications/index.jsx', [
    ("<h3>\U0001F514 ping preferences</h3>", "<h3>Notification preferences</h3>"),
])

patch('src/pages/Dashboard/Home/index.jsx', [
    ("then you are officially locked in.", "You are all set."),
    ("<h3>\U0001F4CB on your plate</h3>", "<h3>My tasks</h3>"),
    ("{/* on your plate */}", "{/* my tasks */}"),
])

patch('src/store/selectors.js', [
    ("const PRIORITY_RANK = { drop: 0, highkey: 1, mid: 2, lowkey: 3 };", "const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 };"),
])

patch('src/pages/Auth/ForgotPassword.jsx', [
    ("happens to the best of us. drop your email and we will absolutely,\n          definitely, 100% send a reset link. (we will not. there is no server. but you feel seen, right?)", "Enter your email and we will send a reset link. (This is a frontend-only demo \u2014 nothing is actually sent.)"),
    ('reset link \u201csent\u201d to {email || \'your email\'}. check your inbox in an alternate universe\n          where this app has a backend. psst: every mock account uses <b>frfr1234</b>.', 'Reset link \u201csent\u201d to {email || \'your email\'}. This is a demo \u2014 every mock account uses the password <b>frfr1234</b>.'),
    ("button text", "button text"),
])

patch('src/pages/Dashboard/Users/index.jsx', [
    ("'Everyone is already in this workspace. popular.'", "'Everyone is already in this workspace.'"),
    ("'Simulated client-side. vibes enforced.'", "'Simulated client-side.'"),
])

patch('src/components/ConfirmDialog/index.jsx', [
    ('/* ConfirmDialog \u2014 "this is permanent fr fr" gate for destructive actions. */', '/* ConfirmDialog \u2014 confirmation gate for destructive actions. */'),
])

patch('src/components/EmptyState/index.jsx', [
    ('/* EmptyState \u2014 for the "it is giving... nothing" moments. */', '/* EmptyState \u2014 shown when a list has nothing to render. */'),
])
