package com.skatepod.api.program;

import com.skatepod.api.common.BadRequestException;
import com.skatepod.api.common.NotFoundException;
import com.skatepod.api.music.MusicFile;
import com.skatepod.api.music.MusicFileService;
import com.skatepod.api.music.dto.MusicFileResponse;
import com.skatepod.api.program.dto.PlacementDto;
import com.skatepod.api.program.dto.ProgramRequest;
import com.skatepod.api.program.dto.ProgramResponse;
import com.skatepod.api.program.dto.RinkPointDto;
import com.skatepod.api.student.Student;
import com.skatepod.api.student.StudentRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProgramService {

    private final ProgramRepository programs;
    private final StudentRepository students;
    private final MusicFileService musicFiles;

    public ProgramService(ProgramRepository programs, StudentRepository students, MusicFileService musicFiles) {
        this.programs = programs;
        this.students = students;
        this.musicFiles = musicFiles;
    }

    /** Every program, or one student's, oldest first. A student without any just has none. */
    @Transactional(readOnly = true)
    public List<ProgramResponse> list(UUID studentId) {
        List<Program> found = studentId == null
                ? programs.findAllByOrderByCreatedAtAsc()
                : programs.findByStudentIdOrderByCreatedAtAsc(studentId);
        return found.stream().map(ProgramService::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProgramResponse get(UUID id) {
        return toResponse(findProgram(id));
    }

    @Transactional
    public ProgramResponse create(ProgramRequest request) {
        Student student = findStudent(request.studentId());
        Checked checked = check(request);
        Program program = programs.save(new Program(student, request.name().trim(), request.musicTitle().trim(),
                blankToNull(request.artist()), request.duration(), request.track(), checked.level(),
                blankToNull(request.musicLink()), checked.musicFile(), checked.elements(), checked.points(),
                checked.placements()));
        return toResponse(program);
    }

    @Transactional
    public ProgramResponse update(UUID id, ProgramRequest request) {
        Program program = findProgram(id);
        if (!program.getStudent().getId().equals(request.studentId())) {
            throw new BadRequestException("A program stays with its student: make a new program for the other student");
        }
        Checked checked = check(request);
        MusicFile oldFile = program.getMusicFile();
        program.update(request.name().trim(), request.musicTitle().trim(), blankToNull(request.artist()),
                request.duration(), request.track(), checked.level(), blankToNull(request.musicLink()),
                checked.musicFile(), checked.elements(), checked.points(), checked.placements());
        // A replaced or removed file isn't needed any more (unless another program uses it too).
        if (oldFile != null && !Objects.equals(oldFile.getId(), idOf(checked.musicFile()))) {
            deleteFileIfUnused(oldFile);
        }
        return toResponse(program);
    }

    /** Deletes a program, and its music file if no other program uses it. */
    @Transactional
    public void delete(UUID id) {
        Program program = findProgram(id);
        MusicFile file = program.getMusicFile();
        programs.delete(program);
        programs.flush(); // so the count below no longer sees this program
        if (file != null) deleteFileIfUnused(file);
    }

    /**
     * Deletes all of a student's programs and their music files (StudentService.delete calls this before
     * deleting the student). The database would delete the programs by itself (ON DELETE CASCADE), but not
     * the files on disk, so it's done here. A file another student's program also uses is kept.
     *
     * Every program belongs to exactly one student today, so all of them go. Programs shared by a team
     * (pairs, synchro, Theatre On Ice) will need different rules when they come; that's out of scope for now.
     */
    @Transactional
    public void deleteAllFor(UUID studentId) {
        List<Program> theirs = programs.findByStudentIdOrderByCreatedAtAsc(studentId);
        List<MusicFile> files = theirs.stream().map(Program::getMusicFile).filter(Objects::nonNull).distinct().toList();
        programs.deleteAll(theirs);
        programs.flush(); // so the counts below no longer see these programs
        files.forEach(this::deleteFileIfUnused);
    }

    /** What a valid request turns into: the level, element codes, rink map and music file. */
    private record Checked(String level, List<String> elements, List<ProgramPathPoint> points,
                           List<ProgramPlacement> placements, MusicFile musicFile) {
    }

    private Checked check(ProgramRequest request) {
        String level = request.level().trim();
        if (!request.track().hasLevel(level)) {
            throw new BadRequestException(level + " is not a level in the " + request.track().getDisplayName() + " track");
        }
        List<String> elements = request.elements().stream().map(String::trim).toList();
        elements.forEach(ProgramService::checkCode);
        MusicFile file = request.musicFileId() == null ? null : musicFiles.find(request.musicFileId());
        return new Checked(level, elements, toPathPoints(request.paths()), toPlacements(request.placements()), file);
    }

    private void deleteFileIfUnused(MusicFile file) {
        if (programs.countByMusicFileId(file.getId()) == 0) {
            musicFiles.delete(file);
        }
    }

    private static UUID idOf(MusicFile file) {
        return file == null ? null : file.getId();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static void checkCode(String code) {
        if (ElementCatalog.find(code).isEmpty()) {
            throw new BadRequestException(code + " is not an element in the catalog");
        }
    }

    /** Lines on the rink are stored as one list of points, each knowing which line it belongs to. */
    private static List<ProgramPathPoint> toPathPoints(List<List<RinkPointDto>> paths) {
        List<ProgramPathPoint> points = new ArrayList<>();
        if (paths == null) return points;
        for (int pathIndex = 0; pathIndex < paths.size(); pathIndex++) {
            for (RinkPointDto point : paths.get(pathIndex)) {
                points.add(new ProgramPathPoint(pathIndex, point.x(), point.y()));
            }
        }
        return points;
    }

    private static List<ProgramPlacement> toPlacements(List<PlacementDto> placements) {
        if (placements == null) return List.of();
        return placements.stream().map(item -> {
            checkCode(item.code().trim());
            return new ProgramPlacement(item.id().trim(), item.code().trim(), item.x(), item.y());
        }).toList();
    }

    private Program findProgram(UUID id) {
        return programs.findById(id).orElseThrow(() -> new NotFoundException("Program", id));
    }

    private Student findStudent(UUID id) {
        return students.findById(id).orElseThrow(() -> new NotFoundException("Student", id));
    }

    static ProgramResponse toResponse(Program program) {
        Student student = program.getStudent();
        List<ElementCatalog.Element> elements = program.getElements().stream()
                .map(code -> ElementCatalog.find(code).orElse(new ElementCatalog.Element(code, code, "Unknown")))
                .toList();
        // Put the points back into their lines, in order.
        Map<Integer, List<RinkPointDto>> lines = new TreeMap<>();
        for (ProgramPathPoint point : program.getPathPoints()) {
            lines.computeIfAbsent(point.getPathIndex(), index -> new ArrayList<>())
                    .add(new RinkPointDto(point.getX(), point.getY()));
        }
        List<PlacementDto> placements = program.getPlacements().stream()
                .map(item -> new PlacementDto(item.getKey(), item.getCode(), item.getX(), item.getY()))
                .toList();
        MusicFileResponse musicFile = program.getMusicFile() == null ? null : MusicFileResponse.from(program.getMusicFile());
        return new ProgramResponse(program.getId(), student.getId(), student.getName(), program.getName(),
                program.getMusicTitle(), program.getArtist(), program.getDuration(), program.getTrack(),
                program.getTrack().getDisplayName(), program.getLevel(), program.getMusicLink(), musicFile, elements,
                new ArrayList<>(lines.values()), placements, program.getCreatedAt(), program.getUpdatedAt());
    }
}
