import {useState} from 'react';
import type {CreateExpenseRequest} from "@/types/expense.ts";
import { Modal } from '@/components/common/Modal.tsx';
import type{FormEvent} from "react";
import type {Member} from "@/types/workspace.ts";

interface AddModalProps {
    workspaceId: string;
    members: Member[];
    onClose(): void;
    onAdd(request: CreateExpenseRequest): Promise<void>;
}

/** Modal to add an expense: title, amount, and which members split it. */
export function AddExpenseModal({ workspaceId, members, onClose, onAdd }: AddModalProps) {
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    const toggleMember = (id: string) => {
        setSelectedMembers(prev =>
            prev.includes(id)
            ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if(!title.trim()) return;

        if(!amount) return;

        if(selectedMembers.length === 0) return;

        const parsedAmount = Number(amount);
        if(parsedAmount <= 0) return;

        onAdd({
            title,
            amount: parsedAmount,
            workspaceId,
            participantIds: selectedMembers,
        });

        onClose();
    }

    return (
        <Modal
            as = "form"
            onSubmit={handleSubmit}
            onClose={onClose}
        >
            <h2 className="modal__title">Add Expense</h2>

            <label className="modal__field-wrap">
                <span className="modal__label">Title</span>
                <input
                    className="modal__input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </label>

            <label className="modal__field-wrap">
                <span className="modal__label">Amount</span>
                <input
                    className="modal__input"
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                />
            </label>

            <div className="modal__field-wrap">
                <span className="modal__label">Participants</span>

                <div className="we__member-toggles">
                    {members.map(member => (
                        <label
                            className="we__member-toggle"
                            key={member.userId}>
                            <input
                                className="we__member-toggle__input"
                                type="checkbox"
                                checked={selectedMembers.includes(member.userId)}
                                onChange={() => toggleMember(member.userId)}
                                />

                            {member.firstName} {member.lastName}
                        </label>
                    ))}
                </div>
            </div>

            <div className="modal__actions">
                <span className="modal__spacer"/>
                <button
                    type="button"
                    className="modal__btn modal__btn--ghost"
                    onClick={onClose}
                    >
                    Cancel
                </button>

                <button
                    type="submit"
                    className="modal__btn modal__btn--primary"
                    disabled={
                        !title.trim() ||
                        !amount ||
                        selectedMembers.length === 0
                    }
                >
                    Save
                </button>
            </div>
        </Modal>
    );
}
