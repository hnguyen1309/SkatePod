package com.skatepod.api.program;

import com.skatepod.api.common.BadRequestException;
import com.skatepod.api.common.NotFoundException;
import com.skatepod.api.program.dto.PlacementDto;
import com.skatepod.api.program.dto.ProgramRequest;
import com.skatepod.api.program.dto.ProgramResponse;
import com.skatepod.api.program.dto.RinkPointDto;
import com.skatepod.api.student.Discipline;
import com.skatepod.api.student.Student;
import com.skatepod.api.student.StudentDiscipline;
import com.skatepod.api.student.StudentRepository;
import com.skatepod.api.student.Track;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProgramService {

    // What a new program starts with, like DEFAULT_PROGRAM in the app.
    static final String DEFAULT_TITLE = "Untitled program";
    static final String DEFAULT_DURATION = "2:10";

    private final ProgramRepository programs;
    private final StudentRepository students;

    public ProgramService(ProgramRepository programs, StudentRepository students) {
        this.programs = programs;
        this.students = students;
    }

    /** The student's saved program, or the starting program on their own track if they don't have one yet. */
    @Transactional(readOnly = true)
    public ProgramResponse get(UUID studentId) {
        Student student = findStudent(studentId);
        return programs.findByStudentId(studentId)
                .map(ProgramService::toResponse)
                .orElseGet(() -> startingProgram(student));
    }

    /** Saves (creates or replaces) the student's program. */
    @Transactional
    public ProgramResponse save(UUID studentId, ProgramRequest request) {
        Student student = findStudent(studentId);
        String level = request.level().trim();
        if (!request.track().hasLevel(level)) {
            throw new BadRequestException(level + " is not a level in the " + request.track().getDisplayName() + " track");
        }
        List<String> elements = request.elements().stream().map(String::trim).toList();
        elements.forEach(ProgramService::checkCode);
        List<ProgramPathPoint> points = toPathPoints(request.paths());
        List<ProgramPlacement> placements = toPlacements(request.placements());
        String artist = request.artist() == null || request.artist().isBlank() ? null : request.artist().trim();

        Optional<Program> existing = programs.findByStudentId(studentId);
        Program program;
        if (existing.isPresent()) {
            program = existing.get();
            program.update(request.musicTitle().trim(), artist, request.duration(), request.track(), level,
                    elements, points, placements);
        } else {
            program = programs.save(new Program(student, request.musicTitle().trim(), artist, request.duration(),
                    request.track(), level, elements, points, placements));
        }
        return toResponse(program);
    }

    /** Removes the student's program. The next get gives the starting program again. */
    @Transactional
    public void delete(UUID studentId) {
        findStudent(studentId);
        programs.findByStudentId(studentId).ifPresent(programs::delete);
    }

    /**
     * The program a student starts with: the app's default program (Untitled, 2:10, four starter elements)
     * on the student's own track. That's what the track on a student's discipline is for.
     *  - Track: from their Standard Freeskate discipline, else Adult Freeskate, else any discipline, else Championship.
     *  - Level: their level in that discipline if the track has it (e.g. "Preliminary"), else Preliminary
     *    on the Championship track, else the track's first level.
     */
    static ProgramResponse startingProgram(Student student) {
        Optional<StudentDiscipline> singles = student.getDisciplines().stream()
                .min(Comparator.comparing((StudentDiscipline item) -> singlesRank(item.getDiscipline())));
        Track track = singles.map(StudentDiscipline::getTrack).orElse(Track.CHAMPIONSHIP);
        String level = singles.map(StudentDiscipline::getLevel).filter(track::hasLevel)
                .orElse(track == Track.CHAMPIONSHIP ? "Preliminary" : track.getLevels().get(0));
        List<ElementCatalog.Element> elements = ElementCatalog.STARTER_CODES.stream()
                .map(code -> ElementCatalog.find(code).orElseThrow()).toList();
        return new ProgramResponse(student.getId(), student.getName(), false, DEFAULT_TITLE, null, DEFAULT_DURATION,
                track, track.getDisplayName(), level, elements, List.of(), List.of(), null);
    }

    /** Freeskate disciplines first, since programs are singles programs. */
    private static int singlesRank(Discipline discipline) {
        return switch (discipline) {
            case STANDARD_FREESKATE -> 0;
            case ADULT_FREESKATE -> 1;
            default -> 2 + discipline.ordinal();
        };
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
        return new ProgramResponse(student.getId(), student.getName(), true, program.getMusicTitle(),
                program.getArtist(), program.getDuration(), program.getTrack(), program.getTrack().getDisplayName(),
                program.getLevel(), elements, new ArrayList<>(lines.values()), placements, program.getUpdatedAt());
    }
}
