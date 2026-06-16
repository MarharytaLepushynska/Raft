import { useState } from 'react';

interface Props {
    question: string;
    answer: string;
}

/** A single FAQ entry that expands to show its answer when clicked. */
export function FaqItem({ question, answer }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <div className={`faq-item ${open ? 'faq-item--open' : ''}`}>
            <button
                type="button"
                className="faq-item__question"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                <span>{question}</span>
                <span className="faq-item__icon">▼</span>
            </button>

            {open && <div className="faq-item__answer">{answer}</div>}
        </div>
    );
}
