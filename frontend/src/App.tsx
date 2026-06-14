import {Route, Routes} from 'react-router-dom';
import {AppLayout} from '@/components/layout/AppLayout';
import {DashboardPage} from '@/pages/dashboard/DashboardPage';
import {TodoPage} from '@/pages/todo/TodoPage';
import {CalendarPage} from '@/pages/calendar/CalendarPage';
import {NotesPage} from '@/pages/notes/NotesPage';
import {SpacesPage} from '@/pages/spaces/SpacesPage';
import {WorkspacePage} from '@/pages/spaces/WorkspacePage';
import {PlaceholderPage} from '@/pages/placeholder/PlaceholderPage';
import {LoginPage} from '@/pages/auth/LoginPage';
import {RegisterPage} from '@/pages/auth/RegisterPage';
import {ProfilePage} from "@/pages/profile/ProfilePage";
import {ProtectedRoute} from '@/auth/ProtectedRoute';
import { ExpensesPage } from '@/pages/expenses/ExpensesPage';
import { HelpPage } from '@/pages/help/HelpPage';

function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/register" element={<RegisterPage/>}/>

            <Route element={<ProtectedRoute/>}>
                <Route path="/" element={<AppLayout/>}>
                    <Route index element={<DashboardPage/>}/>
                    <Route path="todo" element={<TodoPage/>}/>
                    <Route path="calendar" element={<CalendarPage/>}/>
                    <Route path="notes" element={<NotesPage/>}/>
                    <Route path="spaces" element={<SpacesPage/>}/>
                    <Route path="spaces/:id" element={<WorkspacePage/>}/>
                    <Route path="profile" element={<ProfilePage/>}/>
                    <Route path="*" element={<PlaceholderPage />} />
                    <Route path="expenses" element={<ExpensesPage />} />
                    <Route path="help" element={<HelpPage />} />
        </Route>
            </Route>
        </Routes>
    );
}

export default App;
