const Sequelize = require("sequelize");
const {models} = require("../models");

// Autoload the quiz with id equals to :quizId
exports.load = (req, res, next, quizId) => {

    models.quiz.findById(quizId)
    .then(quiz => {
        if (quiz) {
            req.quiz = quiz;
            next();
        } else {
            throw new Error('There is no quiz with id=' + quizId);
        }
    })
    .catch(error => next(error));
};


// GET /quizzes
exports.index = (req, res, next) => {

    models.quiz.findAll()
    .then(quizzes => {
        res.render('quizzes/index.ejs', {quizzes});
    })
    .catch(error => next(error));
};


// GET /quizzes/:quizId
exports.show = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/show', {quiz});
};


// GET /quizzes/new
exports.new = (req, res, next) => {

    const quiz = {
        question: "", 
        answer: ""
    };

    res.render('quizzes/new', {quiz});
};

// POST /quizzes/create
exports.create = (req, res, next) => {

    const {question, answer} = req.body;

    const quiz = models.quiz.build({
        question,
        answer
    });

    // Saves only the fields question and answer into the DDBB
    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz created successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/new', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error creating a new Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/edit
exports.edit = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/edit', {quiz});
};


// PUT /quizzes/:quizId
exports.update = (req, res, next) => {

    const {quiz, body} = req;

    quiz.question = body.question;
    quiz.answer = body.answer;

    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz edited successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/edit', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error editing the Quiz: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId
exports.destroy = (req, res, next) => {

    req.quiz.destroy()
    .then(() => {
        req.flash('success', 'Quiz deleted successfully.');
        res.redirect('/quizzes');
    })
    .catch(error => {
        req.flash('error', 'Error deleting the Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/play
exports.play = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || '';

    res.render('quizzes/play', {
        quiz,
        answer
    });
};


// GET /quizzes/:quizId/check
exports.check = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', {
        quiz,
        result,
        answer
    });
};



exports.random_play = (req, res, next) => {

    let score;
    let quizzesId;




    if (req.session.randomPlay === undefined || (req.session.randomPlay.length === 0)) {

        score = 0;

        quizzesId = [];

        models.quiz.findAll()
        .each(quiz => {
            quizzesId.push(quiz.id);
        })
        .then(() => {
            if (quizzesId.length === 0) {
                res.render('index');
            }
            let ids = Math.floor(Math.random() * (quizzesId[quizzesId.length - 1] + 1 - quizzesId[0]) + quizzesId[0]);
            let i = quizzesId.indexOf(ids);
            if (i !== -1) {
                quizzesId.splice(i, 1);
            }

            req.session.randomPlay = quizzesId;
            console.log(req.session.randomPlay);
            console.log("log primera vez");

            models.quiz.findById(ids).then(quiz => {
                res.render('quizzes/random_play', {
                    score,
                    quiz
                })
            })

        })
    } else {
        quizzesId = req.session.randomPlay;
        console.log(quizzesId);

        let quizzesTotales = [];
        models.quiz.findAll().then( quizzes => {
            quizzesTotales = quizzes;
            score = quizzesTotales.length - quizzesId.length;
            console.log(score);
            console.log("log de los puntos");


            let ids = Math.floor(Math.random() * (quizzesId[quizzesId.length - 1] + 1 - quizzesId[0]) + quizzesId[0]);
            let i = quizzesId.indexOf(ids);
            if (i !== -1) {
                quizzesId.splice(i, 1);
            }


            req.session.randomPlay = quizzesId;
            console.log(req.session.randomPlay);
            console.log("log segunda vez");

            models.quiz.findById(ids).then(quiz => {
                res.render('quizzes/random_play', {
                    score,
                    quiz
                })
            })
        });





    }

}

//GET '/quizzes/randomcheck/:quizId?answer=respuesta'
exports.randomcheck = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || "";

    models.quiz.findAll().then( quizzes => {
        console.log(quizzes.length);

        let quizzesId = req.session.randomPlay;

        let score = quizzes.length - (quizzesId.length + 1);

        console.log(score);

        const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

        if (result) { score++; }

        console.log(score);

        if(score === quizzes.length) {

            res.render('quizzes/random_nomore', {score});

        } else {

            res.render('quizzes/random_result', {
                score,
                result,
                answer
            })
        }

    })


}


