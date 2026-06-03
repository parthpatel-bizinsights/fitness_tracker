const { WorkoutSession, ExerciseLog, WorkoutPlan, Exercise } = require("../models");
const apiError = require("../../utils/error.util");
const apiResponse = require("../../utils/response.util");
const HTTP_STATUS = require("../../constants/httpStatus.constant");
const HTTP_CODE = require("../../constants/httpCode.constant");
const { updateStreak } = require("../helpers/streakCalc");

const startSession = async (req, res, next) => {
  try {
    const { workoutPlanId, planName } = req.body;
    
    let name = planName || "Custom Workout Session";
    let planExercises = [];

    if (workoutPlanId) {
      const plan = await WorkoutPlan.findOne({ where: { id: workoutPlanId, userId: req.user.id } });
      if (plan) {
        name = plan.name;
        planExercises = plan.exercises || [];
      }
    }

    const session = await WorkoutSession.create({
      userId: req.user.id,
      workoutPlanId: workoutPlanId || null,
      planName: name,
      date: new Date().toISOString().split("T")[0],
      completed: false,
    });

    // Pre-populate exercise logs if plan has exercises
    const logs = [];
    for (const pe of planExercises) {
      const fullEx = await Exercise.findByPk(pe.exerciseId);
      const log = await ExerciseLog.create({
        workoutSessionId: session.id,
        exerciseId: pe.exerciseId,
        sets: pe.sets,
        reps: pe.reps,
        weightKg: pe.weightKg,
        setData: Array.from({ length: pe.sets }).map((_, idx) => ({
          set: idx + 1,
          reps: pe.reps,
          weightKg: pe.weightKg,
          done: false,
        })),
      });
      logs.push(log);
    }

    res.status(HTTP_STATUS.CREATED).json(
      new apiResponse(HTTP_STATUS.CREATED, HTTP_CODE.CREATED, "Workout session started", {
        session,
        exerciseLogs: logs,
      })
    );
  } catch (error) {
    next(error);
  }
};

const logSet = async (req, res, next) => {
  try {
    const { id } = req.params; // session id
    const { exerciseId, setData } = req.body;

    if (!exerciseId || !setData) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "exerciseId and setData are required"));
    }

    const session = await WorkoutSession.findOne({ where: { id, userId: req.user.id } });
    if (!session) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Workout session not found"));
    }

    let log = await ExerciseLog.findOne({ where: { workoutSessionId: id, exerciseId } });
    if (!log) {
      log = await ExerciseLog.create({
        workoutSessionId: id,
        exerciseId,
      });
    }

    log.setData = setData;
    // Calculate aggregate sets, reps, max weight for easy history lookup
    log.sets = setData.length;
    log.reps = setData.reduce((acc, curr) => acc + (curr.reps || 0), 0) / setData.length || 0;
    log.weightKg = Math.max(...setData.map(s => s.weightKg || 0));
    await log.save();

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Set logged successfully", log)
    );
  } catch (error) {
    next(error);
  }
};

const completeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { durationMins, notes, exerciseLogs } = req.body;

    const session = await WorkoutSession.findOne({ where: { id, userId: req.user.id } });
    if (!session) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Workout session not found"));
    }

    // Save final logged exercises/sets if provided in completion body
    if (exerciseLogs && Array.isArray(exerciseLogs)) {
      for (const el of exerciseLogs) {
        let log = await ExerciseLog.findOne({ where: { workoutSessionId: id, exerciseId: el.exerciseId } });
        if (!log) {
          log = await ExerciseLog.create({ workoutSessionId: id, exerciseId: el.exerciseId });
        }
        log.setData = el.sets;
        log.sets = el.sets.length;
        log.reps = el.sets[0]?.reps || 0;
        log.weightKg = el.sets[0]?.weightKg || 0;
        await log.save();
      }
    }

    session.completed = true;
    session.durationMins = durationMins || session.durationMins || 0;
    session.notes = notes || session.notes;
    await session.save();

    // Trigger streak update on user model
    await updateStreak(req.user);

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Workout session completed and streak updated", session)
    );
  } catch (error) {
    next(error);
  }
};

const discardSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await WorkoutSession.findOne({ where: { id, userId: req.user.id } });
    if (!session) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Workout session not found"));
    }

    await session.destroy(); // Cascade triggers log deletion
    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Workout session discarded successfully", null)
    );
  } catch (error) {
    next(error);
  }
};

const getSessionHistory = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const pageIndex = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const offset = (pageIndex - 1) * pageSize;

    const { count, rows } = await WorkoutSession.findAndCountAll({
      where: { userId: req.user.id, completed: true },
      limit: pageSize,
      offset,
      order: [["date", "DESC"], ["createdAt", "DESC"]],
      include: [
        {
          model: ExerciseLog,
          as: "exerciseLogs",
          include: [{ model: Exercise, as: "exercise" }]
        }
      ]
    });

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Workout history retrieved", {
        total: count,
        page: pageIndex,
        limit: pageSize,
        sessions: rows,
      })
    );
  } catch (error) {
    next(error);
  }
};

const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await WorkoutSession.findOne({
      where: { id, userId: req.user.id },
      include: [
        {
          model: ExerciseLog,
          as: "exerciseLogs",
          include: [{ model: Exercise, as: "exercise" }]
        }
      ]
    });

    if (!session) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Workout session not found"));
    }

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Workout session details retrieved", session)
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startSession,
  logSet,
  completeSession,
  discardSession,
  getSessionHistory,
  getSessionById,
};
