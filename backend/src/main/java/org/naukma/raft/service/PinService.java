package org.naukma.raft.service;

import lombok.RequiredArgsConstructor;
import org.naukma.raft.dto.request.PinRequest;
import org.naukma.raft.dto.response.PinResponse;
import org.naukma.raft.entity.Note;
import org.naukma.raft.entity.Pin;
import org.naukma.raft.entity.User;
import org.naukma.raft.enums.PinType;
import org.naukma.raft.errorsHadling.AccessDeniedException;
import org.naukma.raft.errorsHadling.ConflictException;
import org.naukma.raft.errorsHadling.NotFoundException;
import org.naukma.raft.repository.NoteRepository;
import org.naukma.raft.repository.PinRepository;
import org.naukma.raft.repository.UserRepository;
import org.naukma.raft.repository.WorkspaceMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PinService {

    private final PinRepository pinRepository;
    private final UserRepository userRepository;
    private final NoteRepository noteRepository;
    private final WorkspaceMemberRepository memberRepository;

    private static final int MAX_PINS_PER_USER = 20;

    @Transactional(readOnly = true)
    public List<PinResponse> getPins(Long userId) {
        return pinRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public PinResponse createPin(Long userId, PinRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if ((request.getNoteId() == null) == (request.getImageUrl() == null)) {
            throw new IllegalArgumentException("Exactly one of noteId or imageUrl must be provided");
        }

        long currentCount = pinRepository.countByUserId(userId);
        if (currentCount >= MAX_PINS_PER_USER) {
            throw new ConflictException("Maximum " + MAX_PINS_PER_USER + " pins allowed");
        }

        Pin.PinBuilder builder = Pin.builder()
                .user(user)
                .type(request.getNoteId() != null ? PinType.NOTE : PinType.IMAGE)
                .x(request.getX())
                .y(request.getY())
                .rotate(request.getRotate());

        if (request.getNoteId() != null) {
            Note note = noteRepository.findById(request.getNoteId())
                    .orElseThrow(() -> new NotFoundException("Note not found"));
            if (!canAccessNote(userId, note)) {
                throw new AccessDeniedException("You do not have access to this note");
            }
            builder.note(note);
        } else {
            builder.imageUrl(request.getImageUrl());
            builder.title(request.getTitle());
            builder.text(request.getText());
        }

        Pin saved = pinRepository.save(builder.build());
        return mapToResponse(saved);
    }

    @Transactional
    public PinResponse updatePinPosition(Long userId, Long pinId, PinRequest request) {
        Pin pin = pinRepository.findById(pinId)
                .orElseThrow(() -> new NotFoundException("Pin not found"));
        if (!pin.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Not your pin");
        }
        pin.setX(request.getX());
        pin.setY(request.getY());
        pin.setRotate(request.getRotate());
        return mapToResponse(pinRepository.save(pin));
    }

    @Transactional
    public void deletePin(Long userId, Long pinId) {
        Pin pin = pinRepository.findById(pinId)
                .orElseThrow(() -> new NotFoundException("Pin not found"));
        if (!pin.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Not your pin");
        }
        pinRepository.delete(pin);
    }

    private boolean canAccessNote(Long userId, Note note) {
        var workspace = note.getFolder().getWorkspace();
        return workspace.getOwner().getId().equals(userId) || memberRepository.existsByWorkspace_IdAndUser_Id(workspace.getId(), userId);
    }

    private PinResponse mapToResponse(Pin pin) {
        PinResponse.PinResponseBuilder builder = PinResponse.builder()
                .id(pin.getId().toString())
                .type(pin.getType())
                .x(pin.getX())
                .y(pin.getY())
                .rotate(pin.getRotate());

        if (pin.getType() == PinType.NOTE && pin.getNote() != null) {
            builder.noteId(pin.getNote().getId().toString())
                    .title(pin.getNote().getTitle())
                    .text(pin.getNote().getContent());
        } else {
            builder.imageUrl(pin.getImageUrl())
                    .title(pin.getTitle())
                    .text(pin.getText());
        }
        return builder.build();
    }
}