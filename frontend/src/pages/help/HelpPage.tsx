import './HelpPage.css';
import {FaqItem} from "@/pages/help/FeqItem.tsx";
import {WhatsNew} from "@/pages/help/WhatsNew";
import {UsageTips} from "@/pages/help/UsageTips";

const FAQ_ITEMS = [
    {
        question: 'How do shared expenses work?',
        answer: 'In a shared workspace, open the Expenses tab and click "+ Add expense". Choose who participates — the cost splits equally between selected members.',
    },
    {
        question: 'Who can edit or delete a folder?',
        answer: 'Only the folder creator and the workspace owner can edit or delete a folder. Regular members can view but not modify folders.',
    },
    {
        question: 'Who can edit or delete a note in a shared workspace?',
        answer: 'Only the note creator can edit or delete a note. Other members can view but not modify notes created by others.',
    },
    {
        question: 'How do I create a new workspace?',
        answer: 'Click on the "Spaces" menu in the sidebar, then click plus button. You can create either a personal workspace (only for you) or a shared workspace (invite members).',
    },
    {
        question: 'How can I invite members to my shared workspace?',
        answer: 'answer: \'When creating a new shared workspace, you can add member in the "Members" field. Enter the username of the person you want to invite.',
    },
    {
        question: 'What are achievements and how do I earn them?',
        answer: 'Achievements are rewards for completing certain actions. For example: create 5 notes, complete 10 tasks, add 15 expenses, or settle all debts. You can see your progress in your profile.',
    },
    {
        question: 'How does the pinboard work?',
        answer: 'You can pin any note or image to your dashboard for quick access. Click the pin icon on a note, or use the "Add photo" button on the pinboard to upload an image.',
    },
    {
        question: 'Can I change the app theme and accent color?',
        answer: 'Yes! Go to Settings → Appearance. You can switch between light, dark, or system theme, and choose from several accent colors (Rose, Coral, Green, etc.).',
    },
    {
        question: 'What is the difference between personal and shared folders?',
        answer: 'Personal folders are visible only to you. Shared folders are visible to all members of the workspace, and any member can add notes to them (but only the folder owner or workspace admin can edit/delete the folder).',
    },
    {
        question: 'How do I change the theme or accent color?',
        answer: 'Go to Settings → Appearance. Under "Theme", choose Light, Dark, or System (follows your device). Under "Accent color", pick from options like Rose, Coral, Green, etc. The change applies immediately.',
    },
    {
        question: 'How do I set a reminder for a task?',
        answer: 'Open a task, click on the reminder icon (bell). You can choose "10 minutes before", "1 hour before", or pick a custom date and time. The reminder will appear as a notification.',
    },
    {
        question: 'How do I remove a pinned image or note from the pinboard?',
        answer: 'Hover over the pinned item – a small "×" (close) icon appears in the top-right corner. Click it to remove the pin. You can also unpin from the note card by clicking the pin icon again.',
    },
    {
        question: 'How do I settle a debt in shared expenses?',
        answer: 'Go to the Expenses page, find the debt under "Owed by me". Click the "Settle" button next to the person you owe. The debt will be marked as paid and removed from your list.',
    },
    {
        question: 'What are task priorities and how do I use them?',
        answer: 'Tasks can have priorities: High, Medium, or Low. When creating or editing a task, select the priority. You can then filter tasks by priority to focus on what matters most.',
    },
    {
        question: 'How do I search for notes or folders?',
        answer: 'On the Notes page, use the search bar at the top of each section. You can search for notes by title or content, and folders by name. For notes, you can also filter by folder.',
    },
    {
        question: 'Can I use personal notes in a shared workspace?',
        answer: 'Yes, you can create personal folders inside any workspace. Personal folders are visible only to you, even if the workspace is shared. Shared folders are visible to all members.',
    },
    {
        question: 'How can I see who created a note?',
        answer: 'On the Notes page, note cards show the creator’s avatar and username for teammates’ notes. Your own notes are displayed in the "My notes" section without extra labels.',
    },
    {
        question: 'Is it possible to recover a deleted note or folder?',
        answer: 'Currently, deleted notes and folders are permanently removed and cannot be restored. Please double-check before deleting.',
    },
    {
        question: 'Where can I see my activity history?',
        answer: 'You can see recent tasks, notes, and expenses on the Dashboard and respective pages. Achievements also track your progress.',
    },
];

export function HelpPage() {
    return (
        <div className="help">

            <div className="help__main">
                <section className="help__contact">
                    <p className="help__contact-label">Need more help?</p>
                    <a href="mailto:raft@gmail.com" className="help__contact-email">
                        raft@gmail.com
                    </a>
                </section>

                <section className="help__faq">
                    <h2 className="help__section-title">Frequently asked questions</h2>
                    <div className="help__faq-list">
                        {FAQ_ITEMS.map((item) => (
                            <FaqItem key={item.question} question={item.question} answer={item.answer} />
                        ))}
                    </div>
                </section>
            </div>

            <div className="help__sidebar">
                <WhatsNew />
                <UsageTips />
            </div>
        </div>
    );
}
