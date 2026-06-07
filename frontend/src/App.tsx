import {Route, Routes} from 'react-router-dom';
import {AppLayout} from '@/components/layout/AppLayout';
import {DashboardPage} from '@/pages/dashboard/DashboardPage';
import {TodoPage} from '@/pages/todo/TodoPage';
import {CalendarPage} from '@/pages/calendar/CalendarPage';
import {PlaceholderPage} from '@/pages/placeholder/PlaceholderPage';
import {NotesPage} from "@/pages/notes/NotesPage.tsx";

function App() {
    return (
        <Routes>
            <Route path="/" element={<AppLayout/>}>
                <Route index element={<DashboardPage/>}/>
                <Route path="todo" element={<TodoPage/>}/>
                <Route path="calendar" element={<CalendarPage/>}/>
                <Route path="*" element={<PlaceholderPage/>}/>
                <Route path="notes" element={<NotesPage/>}/>
            </Route>
        </Routes>
    );
}

export default App;
