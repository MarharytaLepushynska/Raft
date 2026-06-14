import type { Task } from '@/types/task';
import './TaskProgressRing.css';

const R = 62;
const C = 2 * Math.PI * R;

export function TaskProgressRing({ tasks }: { tasks: Task[] }) {
    const total = tasks.length;
    if (total === 0) return null;

    const done = tasks.filter((t) => t.status === 'COMPLETED').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const todo = total - done - inProgress;

    const pct = Math.round((done / total) * 100);
    const doneLen = (done / total) * C;
    const ipLen = (inProgress / total) * C;

    return (
        <section className="todo-ring">
            <h2 className="todo-ring__title">Progress</h2>
            <div className="todo-ring__wrap">
                <svg className="todo-ring__svg" width="150" height="150">
                    <circle className="todo-ring__track" cx="75" cy="75" r={R} fill="none" strokeWidth="14" />
                    <circle
                        className="todo-ring__seg todo-ring__seg--done"
                        cx="75" cy="75" r={R} fill="none" strokeWidth="14"
                        strokeDasharray={`${doneLen} ${C}`}
                    />
                    <circle
                        className="todo-ring__seg todo-ring__seg--progress"
                        cx="75" cy="75" r={R} fill="none" strokeWidth="14"
                        strokeDasharray={`${ipLen} ${C}`}
                        strokeDashoffset={-doneLen}
                    />
                </svg>
                <div className="todo-ring__center">
                    <span className="todo-ring__pct">{pct}%</span>
                    <span className="todo-ring__sub">{done} / {total} done</span>
                </div>
            </div>
            <div className="todo-ring__legend">
                <span className="todo-ring__leg"><i className="todo-ring__leg-dot--done" /> Done <b>{done}</b></span>
                <span className="todo-ring__leg"><i className="todo-ring__leg-dot--progress" /> In progress <b>{inProgress}</b></span>
                <span className="todo-ring__leg"><i className="todo-ring__leg-dot--todo" /> To do <b>{todo}</b></span>
            </div>
        </section>
    );
}
