// Copyright 2016, Google, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// [START app]
'use strict';

process.env.DEBUG = 'actions-on-google:*';
let ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
let express = require('express');
let path = require('path');
let bodyParser = require('body-parser');
let sprintf = require('sprintf-js').sprintf;

let app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParser.json({type: 'application/json'}));
app.use(express.static(path.join(__dirname, 'public')));

// TODO: put the questions in a module
let triviaQuestions = [
  {
    id: 0,
    question: 'Who is the official resident ghost for Hufflepuff',
    answers: [
      'The Fat Friar',
      'The Bloody Baron',
      'Nearly Headless Nick'
    ],
    correct: 0
  },
  {
    id: 1,
    question: 'Who are the only wizards permitted to read the books in the restricted section of the library',
    answers: [
      'Teachers',
      'Visiting wizarding scholars',
      'Students studying advanced Defense Against the Dark Arts'
    ],
    correct: 2
  },
  {
    id: 2,
    question: 'Who uses the incantation, Wingardium Leviosa, to immobolize the troll in the girl\'s bathroom',
    answers: [
      'Ron',
      'Hermione',
      'Harry'
    ],
    correct: 0
  },
  {
    id: 3,
    question: 'On which professor\'s exam does Hermione score 112 percent',
    answers: [
      'Professor Binns',
      'Professor Sprout',
      'Professor Flitwick'
    ],
    correct: 2
  },
  {
    id: 4,
    question: 'Which one of Seamus Finnigan\'s relations is not a wizard',
    answers: [
      'His mother',
      'His father',
      'His grandmother'
    ],
    correct: 1
  },
  {
    id: 5,
    question: 'What color are the wings of the large silver key that opens the door into the third chamber',
    answers: [
      'Pastel pink',
      'Bright white',
      'Bright blue'
    ],
    correct: 2
  },
  {
    id: 6,
    question: 'In Potions class, who is the student that Professor Severus Snape likes the most',
    answers: [
      'Harry',
      'Hermione',
      'Malfoy'
    ],
    correct: 2
  },
  {
    id: 7,
    question: 'What color was Harry Potter\'s father\'s hair',
    answers: [
      'Black',
      'Blond',
      'Dark Red'
    ],
    correct: 0
  },
  {
    id: 8,
    question: 'What is the name of the librarian at Hogwarts',
    answers: [
      'Madam Pince',
      'Madam Prance',
      'Madam Quice'
    ],
    correct: 0
  },
  {
    id: 9,
    question: 'Where does Aunt Petunia leave Harry Potter when she takes Dudley to buy his new school uniform',
    answers: [
      'With Mrs Figg',
      'Locked in his cupboard under the stairs',
      'With her friend Yvonne'
    ],
    correct: 0
  }
];

let multipleChoice = ['a', 'b', 'c', 'd', 'e'];
let askedQuestions = [];

const MIN = 0;
const MAX = 100;
const GAME_CONTEXT = 'game';
const GENERATE_QUESTION_ACTION = 'generate_question';
const REPEAT_QUESTION_ACTION = 'repeat_question';
const REPEAT_ANSWERS_ACTION = 'repeat_answers';
const CHECK_ANSWER_ACTION = 'check_answer';
const CHECK_GUESS_ACTION = 'check_guess';
const QUIT_ACTION = 'quit';
const PLAY_AGAIN_YES_ACTION = 'play_again_yes';
const PLAY_AGAIN_NO_ACTION = 'play_again_no';
const UNEXPECTED_ANSWER_FALLBACK_ACTION = 'unexpected_answer_fallback';
const UNKNOWN_DEEPLINK_ACTION = 'deeplink.unknown';

const YES_NO_CONTEXT = 'yes_no';
const DONE_YES_NO_CONTEXT = 'done_yes_no';
const DONE_YES_ACTION = 'done_yes';
const DONE_NO_ACTION = 'done_no';
const GUESS_ARGUMENT = 'guess';
const RAW_TEXT_ARGUMENT = 'raw_text';

const HIGHER_HINT = 'higher';
const LOWER_HINT = 'lower';
const NO_HINT = 'none';

const SSML_SPEAK_START = '<speak>';
const SSML_SPEAK_END = '</speak>';
const INCORRECT_ANSWER_AUDIO = '<audio src="https://4f8085f8.ngrok.io/audio/ff-strike.wav">buzzer sound</audio>';
const COLD_WIND_AUDIO = '<audio src="https://4f8085f8.ngrok.io/audio/NumberGenieEarcon_ColdWind.wav">cold wind sound</audio>';
const STEAM_ONLY_AUDIO = '<audio src="https://4f8085f8.ngrok.io/audio/NumberGenieEarcon_SteamOnly.wav">steam sound</audio>';
const STEAM_AUDIO = '<audio src="https://4f8085f8.ngrok.io/audio/NumberGenieEarcons_Steam.wav">steam sound</audio>';
const YOU_WIN_AUDIO = '<audio src="https://4f8085f8.ngrok.io/audio/NumberGenieEarcons_YouWin.wav">winning sound</audio>';

const CORRECT_GUESS_PROMPTS = ['Well done! It is indeed %s.', 'Congratulations, that\'s it! The answer is %s.',
    'You got it! It\'s %s.' ];
const INCORRECT_GUESS_PROMPTS = ['Sorry, the correct answer is %s. ', 'Too bad, that\'s not it! The correct answer is %s. '];
const PLAY_AGAIN_QUESTION_PROMPTS = ['Wanna play again?', 'Want to try again?', 'Hey, should we do that again?'];

const QUIT_REVEAL_PROMPTS = ['Sure, I\'ll tell you the number anyway. It was %s.'];
const QUIT_REVEAL_BYE = ['Bye.', 'Good bye.', 'See you later.'];
const QUIT_PROMPTS = ['Alright, talk to you later then.', 'OK, till next time. Bye!',
    'See you later.', 'OK, I\'m already thinking of a question for next time. Bye.'];
const SCORE_PROMPT = ['You got %s correct and %s wrong.'];

const GREETING_PROMPTS = ['Let\'s play Harry Potter Trivia!', 'Welcome to Harry Potter Trivia!'];
const INVOCATION_PROMPT = ['I\'m thinking of a number from %s to %s. What\'s your first guess?'];
const RE_PROMPT = ['Great!', 'Awesome!', 'Cool!', 'Okay, let\'s play again.', 'Okay, here we go again',
    'Alright, one more time with feeling.'];
const RE_INVOCATION_PROMPT = ['I\'m thinking of a new number from %s to %s. What\'s your guess?'];

const SAME_GUESS_PROMPTS_1 = ['It\'s still not %s. Guess %s.'];
const SAME_GUESS_PROMPTS_2 = ['Maybe it\'ll be %s the next time. Let’s play again soon.'];

const MIN_PROMPTS = ['I see what you did there. But no, it\'s higher than %s.'];
const MAX_PROMPTS = ['Oh, good strategy. Start at the top. But no, it’s lower than a %s.'];

const MANY_TRIES_PROMPTS = ['Yes! It\'s %s. Nice job!  How about one more round?'];

const FALLBACK_PROMPT_1 = ['Are you done playing Harry Potter Trivia?'];
const FALLBACK_PROMPT_2 = ['Since I\'m still having trouble, so I\'ll stop here. Let’s play again soon.'];

const NO_INPUT_PROMPTS = ['I didn\'t hear an answer', 'If you\'re still there, what\'s your guess?', 'We can stop here. Let\'s play again soon.'];

// Utility function to pick prompts
function getRandomPrompt (array) {
  return array[Math.floor(Math.random() * (array.length))];
}

function getRandomQuestion (array) {
  // TODO: currently infinite loop when out of questions.
  console.log('generateQuestion');
  console.log('Total questions = ' + array.length + ', Asked question count = ' + askedQuestions.length );

  let result = undefined;
  if( array.length != askedQuestions.length ) {
    do {
      result = array[Math.floor(Math.random() * (array.length))];
      console.log('Question ID = ' + result.id);
    } while( askedQuestions.indexOf(result.id) != -1 );
    askedQuestions.push(result.id);
  }
  return result;
}


// HTTP POST request handler
app.post('/', function (request, response) {
  console.log('headers: ' + JSON.stringify(request.headers));
  console.log('body: ' + JSON.stringify(request.body));

  const assistant = new ApiAiAssistant({request: request, response: response});

  function generateQuestion (assistant) {
    console.log('generateQuestion');

    let question = getRandomQuestion(triviaQuestions);
    if(question === undefined) {
      console.log("*******************************************************");
      return;
    }

    assistant.data.question = question;
    assistant.data.correctCount = 0;
    assistant.data.incorrectCount = 0;
    assistant.ask(sprintf( question.question + ". a," + question.answers[0] + ",b," +
      question.answers[1] + ", or c," + question.answers[2] ));


    //assistant.ask(sprintf(sprintf(getRandomPrompt(GREETING_PROMPTS)) + ' ' +
    //  getRandomPrompt(INVOCATION_PROMPT), MIN, MAX), NO_INPUT_PROMPTS);
  }

  function repeatQuestion (assistant) {
    console.log('repeatQuestion');
    let question = assistant.data.question;
    assistant.ask(sprintf( "Sure." + question.question + ". a," + question.answers[0] + ",b," +
      question.answers[1] + ", or c," + question.answers[2] ));
  }

  function repeatAnswers (assistant) {
    console.log('repeatAnswers');
    let question = assistant.data.question;
    assistant.ask(sprintf( "Sure." + ". a," + question.answers[0] + ",b," +
      question.answers[1] + ", or c," + question.answers[2] ));
  }

  function checkAnswer (assistant) {
    console.log('checkAnswer');

    let responsePrompt = '';
    let currentQuestion = assistant.data.question;
    let currentAnswer = multipleChoice.indexOf(assistant.data.user_answer);

    console.log('user answer is ' + multipleChoice.indexOf(assistant.data.user_answer));
    console.log('correct answer is ' + currentQuestion.correct);

    if( currentQuestion.correct === currentAnswer) {
      assistant.data.correctCount++;
      responsePrompt += SSML_SPEAK_START + YOU_WIN_AUDIO +
        sprintf(getRandomPrompt(CORRECT_GUESS_PROMPTS),
        currentQuestion.answers[currentQuestion.correct]) + ' ';
    } else {
      assistant.data.incorrectCount++;
      responsePrompt += SSML_SPEAK_START + INCORRECT_ANSWER_AUDIO +
        sprintf(getRandomPrompt(INCORRECT_GUESS_PROMPTS), " " + multipleChoice[currentQuestion.correct] + "." + currentQuestion.answers[currentQuestion.correct]) + ' ';
    }

    let nextQuestion = getRandomQuestion(triviaQuestions);

    if(nextQuestion != undefined) {
      assistant.data.question = nextQuestion;
      responsePrompt += sprintf( "Next question." + nextQuestion.question + ". a," + nextQuestion.answers[0] + ",b," +
        nextQuestion.answers[1] + ", or c," + nextQuestion.answers[2] ) + SSML_SPEAK_END;
      assistant.ask(responsePrompt);
    }
  }

  function quit (assistant) {
    console.log('quit');
    let answer = assistant.data.answer;
    assistant.tell(sprintf(getRandomPrompt(QUIT_REVEAL_PROMPTS), answer) + getRandomPrompt(QUIT_REVEAL_BYE));
  }

  function playAgainYes (assistant) {
    console.log('playAgainYes');

    let question = getRandomQuestion(triviaQuestions);
    if(question === undefined) {
      console.log("*******************************************************");
      return;
    }

    assistant.data.question = question;
    console.log("asking the next question");
    assistant.ask(sprintf( question.question + ". a," + question.answers[0] + ",b," +
      question.answers[1] + ", or c," + question.answers[2] ));


  }

  function playAgainNo (assistant) {
    console.log('playAgainNo');
    assistant.setContext(GAME_CONTEXT, 1);
    assistant.tell(sprintf(getRandomPrompt(QUIT_PROMPTS) + getRandomPrompt(SCORE_PROMPT), assistant.data.correctCount, assistant.data.incorrectCount));
  }

  function unexpectedAnswerFallback (assistant) {
    console.log('defaultFallback');
    let question = assistant.data.question;
    assistant.ask(sprintf( "Please tell me the letter corresponding to your answer. Here is the question again. " + question.question + ". a," + question.answers[0] + ",b," +
      question.answers[1] + ", or c," + question.answers[2] ));
  }

  function doneYes (assistant) {
    console.log('doneYes');
    assistant.setContext(GAME_CONTEXT, 1);
    assistant.tell(sprintf(getRandomPrompt(QUIT_PROMPTS)));
  }

  function doneNo (assistant) {
    console.log('doneNo');
    assistant.data.fallbackCount = 0;
    assistant.ask(sprintf(getRandomPrompt(RE_PROMPT)) + ' ' +
      sprintf(getRandomPrompt(ANOTHER_GUESS_PROMPT)));
  }

  let actionMap = new Map();
  actionMap.set(GENERATE_QUESTION_ACTION, generateQuestion);
  actionMap.set(REPEAT_QUESTION_ACTION, repeatQuestion);
  actionMap.set(REPEAT_ANSWERS_ACTION, repeatAnswers);
  actionMap.set(CHECK_ANSWER_ACTION, checkAnswer);
  actionMap.set(QUIT_ACTION, quit);
  actionMap.set(PLAY_AGAIN_YES_ACTION, playAgainYes);
  actionMap.set(PLAY_AGAIN_NO_ACTION, playAgainNo);
  actionMap.set(UNEXPECTED_ANSWER_FALLBACK_ACTION, unexpectedAnswerFallback);
  actionMap.set(DONE_YES_ACTION, doneYes);
  actionMap.set(DONE_NO_ACTION, doneNo);

  assistant.handleRequest(actionMap);
});

// Start the web server
let server = app.listen(app.get('port'), function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});
// [END app]
