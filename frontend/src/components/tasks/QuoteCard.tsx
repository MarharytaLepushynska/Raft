import { useState } from 'react';
import './QuoteCard.css';

const QUOTES = [
    'Small steps every day add up to big results.',
    'Resting is an important task too.',
    'TODO: stop reading quotes.',
    'One checkmark = +10 mood.',
    'Opening the app already counts as progress.',
    'This isn’t procrastination. It’s a side quest.',
    'Your ad could be here.',
    'Future you is watching. No pressure.',
    'This task won’t complete itself. I asked.',
];

/** Picks one random quote on mount and shows it on the todo page. */
export function QuoteCard() {
    const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

    return (
        <section className="todo-quote">
            <span className="todo-quote__mark">&ldquo;</span>
            <p className="todo-quote__text">{quote}</p>
        </section>
    );
}
