/* eslint-disable  func-names */
/* eslint-disable  dot-notation */
/* eslint-disable  new-cap */
/* eslint quote-props: ['error', 'consistent']*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports en-US lauguage.
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-trivia
 **/

'use strict';

const Alexa = require('alexa-sdk');
const topics = require('./topic');


const GAME_LENGTH = 10;  // The number of questions per trivia game.
const GAME_STATES = {
    GAMEPLAY: '_GAMEPLAYMODE', // Asking trivia questions.
    START: '_STARTMODE', // Entry point, start the game.
    TOPIC: '_TOPICMODE',
    HELP: '_HELPMODE', // The user is asking for help.
};
const APP_ID = 'amzn1.ask.skill.91c64c70-77c9-4706-a9c8-fd08a8317b0c'; // TODO replace with your app ID (OPTIONAL)

/**
 * When editing your questions pay attention to your punctuation. Make sure you use question marks or periods.
 * Make sure the first answer is the correct one. Set at least ANSWER_COUNT answers, any extras will be shuffled in.
 */
const languageString = {
    'en': {
        'translation': {
            'ALL_TOPICS': topics['TOPICS_EN_US'],
            'ASK_MESSAGE_START': 'Would you like to start playing?',
            'CANCEL_MESSAGE': "So sad! Let\'s play again next time.",
            'GAME_NAME': 'Just Name It',
            'GAME_OVER_MESSAGE': 'Your total score is %s points. %s Thank you for playing!',
            'GAME_OVER_TEXT': 'Game Over! \nYour total score is %s points.',
            'GAMEPLAY_UNHANDLED': 'Try saying a number between 1 and %s',
            'GREETING': 'Think fast and Just Name it! Welcome everyone. ',
            'HELP_UNHANDLED': 'Say yes to continue, or no to end the game.',
            'HELP_MESSAGE': "Choose the topic of words. You have to name the right word and get 100 points each. If your answer wrong or repeat your answer before. The game is over. Are you ready to begin?",
            'NAME_IT_RIGHT': "Correct! Next word...",
            'NO_MESSAGE': 'Ok, we\'ll play another time. Goodbye!',
            'SCORE_IS_MESSAGE': 'Your score is %s. ',
            'SKIP_MESSAGE': "You can skip to next category by saying \"Skip.\"",
            'START_OVER':"Would you like to play another game?",
            'START_UNHANDLED': ' Say \"Topic\" for Topic list, say Rule for instructions or say \"Start\" to start random game.',
            'STOP_MESSAGE': 'Would you like to keep playing?',
            'TELL_TOPIC_MESSAGE': "Let\'s begin, Please name %s.",
            //compliment
            'NEED_PRACTICE': 'You may need a little more practice. ',
            'NOT_BAD': 'Not bad. ',
            'WELL_DONE': 'Well done. ',
            'EXCELLENT': 'Excellent. ',
        },
    },
    'en-US': {
        'translation': {
            'ALL_TOPICS': topics['TOPICS_EN_US'],
            'GAME_NAME': 'Just Name It', // Be sure to change this for your skill.
        },
    },
};

const newSessionHandlers = {
    "LaunchRequest": function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("NewSession", true);
    },
    'AMAZON.StartOverIntent': function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState('StartGame', true);
    },
    'AMAZON.HelpIntent': function () {
        this.handler.state = GAME_STATES.HELP;
        this.emitWithState('helpTheUser', true);
    },
    'Unhandled': function () {
        const speechOutput = this.t('START_UNHANDLED');
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(':responseReady');
    },
};

const startStateHandlers = Alexa.CreateStateHandler(GAME_STATES.START, {
    'NewSession': function (newGame) {
        let speechOutput = this.t('GREETING')+" "+this.t('START_UNHANDLED');

        Object.assign(this.attributes, {
            'gameTopics': this.t("ALL_TOPICS"), //array
        });

        this.response.speak(speechOutput)
                .cardRenderer("Say Start to begin, Topic for topics or Help for instructions", this.t("GAME_NAME"))
                .listen("Say Start to begin, Topic for topics or Help for instructions");
        this.emit(':responseReady');
    },
    'AMAZON.YesIntent': function () {
        let index = this.attributes.gameTopics.length;
        let randomIndex = Math.floor(Math.random() * index);

        this.handler.state = GAME_STATES.GAMEPLAY;
        this.emitWithState('StartGame', randomIndex);
    },
    'TopicIntent': function () {
        this.handler.state = GAME_STATES.TOPIC;
        this.emitWithState('TopicsSession');
    },
    'AMAZON.HelpIntent': function () {
        this.handler.state = GAME_STATES.HELP;
        this.emitWithState('helpTheUser', true);
    },
});

const pickTopicsHandlers = Alexa.CreateStateHandler(GAME_STATES.TOPIC, {
    'TopicsSession': function () {
        let allTopics = this.attributes.gameTopics;
        let topicsText = "";
        let topicCount = allTopics.length;
        let speechOutput = "Choose one of the following topics. \nSay the \"Topic\'s number\" to choose a topic or say \"Random\" to start random game. ";

        for (let i = 0; i < topicCount ; i++ ) {
            topicsText += `${i + 1}. ${allTopics[i]['category']}. \n`;
        }

        this.response.speak(speechOutput).listen(topicsText)
                    .cardRenderer("All Topic", topicsText);
        this.emit(':responseReady');
    },
    "TopicsPickIntent": function() {
        let chosenTopic = parseInt(this.event.request.intent.slots.PickNum.value, 10) - 1;

        this.handler.state = GAME_STATES.GAMEPLAY;
        this.emitWithState('StartGame', chosenTopic);
    },
    'AMAZON.YesIntent': function () {
        let index = this.attributes.gameTopics.length;
        let randomIndex = Math.floor(Math.random() * index);

        this.handler.state = GAME_STATES.GAMEPLAY;
        this.emitWithState('StartGame', randomIndex);
    },
    'AMAZON.HelpIntent': function () {
        this.handler.state = GAME_STATES.HELP;
        this.emitWithState('helpTheUser', true);
    },
});

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const gameStateHandlers = Alexa.CreateStateHandler(GAME_STATES.GAMEPLAY, {
    'StartGame': function (gameIndex) {
        const currentTopicSet = this.attributes.gameTopics[gameIndex]; //array
        let currentTopicName = currentTopicSet['category']; //string
        let currentTopicAnswerSet = currentTopicSet['answerSet']; //array
        let currentGameCode = currentTopicSet['gamecode']; //string
        let repromptText = "";

        Object.assign(this.attributes, {
            'speechOutput': repromptText,
            'repromptText': repromptText,
            'gamecode': currentGameCode,
            'currentTopic': currentTopicName,
            'currentTopicAnswerSet': currentTopicAnswerSet,
            'currentTopicIndex': gameIndex,
            'repeatNames': [],
            'score': 0,
        });

        this.response.speak(this.t('TELL_TOPIC_MESSAGE', currentTopicName))
                .listen("Name It")
                .cardRenderer(this.t("GAME_NAME"), this.attributes.currentTopic);
        this.emit(':responseReady');
    },
    'NameItIntent': function () {
        let guessName = this.event.request.intent.slots.Answer.value;
        let capName = capitalizeFirstLetter(guessName);
        let rawNameSet = this.attributes.currentTopicAnswerSet; //array
        let correctNameSet = [];//array
        let currentRepeatNames = this.attributes.repeatNames;
        let currentScore = parseInt(this.attributes.score, 10);
        let code = this.attributes.gamecode;

        let speechOutput = "";
        let repromptText = "";
        let complement = "";

        if (code == "ecap") {
            let theSet = [];
            for (let i = 0; i < rawNameSet.length; i++ ) {
                let answerData = rawNameSet[i]; //this is exeptional object with 2 attr 'nation and cap'
                theSet.push(answerData['cap']); //answerData['cap'] is string
            }
            correctNameSet = theSet;
        } else {
            correctNameSet = rawNameSet;
        }

        if (correctNameSet.includes(capName) && !currentRepeatNames.includes(capName)) {
            currentScore += 100;
            currentRepeatNames.push(capName);
            Object.assign(this.attributes, {'repeatNames':currentRepeatNames});

            if (code == "ecap") {
                var output = rawNameSet[correctNameSet.indexOf(capName)];
                speechOutput = output['cap']+" is "+this.t("NAME_IT_RIGHT");
                repromptText = output['cap']+" is the capital of "+output['nation'];
            } else {
                speechOutput = capName+" is "+this.t("NAME_IT_RIGHT");
                repromptText = capName+" is "+this.t("NAME_IT_RIGHT");
            }

            this.attributes["score"] = currentScore;
            this.response.speak(speechOutput)
                  .cardRenderer(this.attributes.currentTopic, repromptText)
                  .listen(this.t("COUNTDOWN"));
        } else {

            if (currentScore >= 2000) {
                complement = this.t('EXCELLENT');
            } else if ( currentScore >= 1400 && currentScore < 2000) {
                complement = this.t('WELL_DONE');
            } else if (currentScore >= 600 && currentScore < 1400) {
                complement = this.t('NOT_BAD');
            } else {
                complement = this.t('NEED_PRACTICE');
            }

            if (currentRepeatNames.includes(capName)) {
                speechOutput = capName+ " is repeated. Game over. "+this.t("GAME_OVER_MESSAGE", currentScore, complement);
            } else {
                speechOutput = capName+ " is not correct. Game over. "+this.t("GAME_OVER_MESSAGE", currentScore, complement);
            }
            this.response.speak(speechOutput+" Say Restart to restart, Exit to end game.")
                  .cardRenderer(this.t('START_OVER'),this.t('GAME_OVER_TEXT', currentScore))
                  .listen(this.t("START_OVER"));
        }
        this.emit(':responseReady');
    },
    'AMAZON.YesIntent': function () {
        this.handler.state = GAME_STATES.TOPIC;
        this.response.speak('Okay, Starting a new game.');
        this.emitWithState('TopicsSession');
    },
    'AMAZON.StartOverIntent': function () {
        this.handler.state = GAME_STATES.TOPIC;
        this.response.speak('Okay, Starting a new game.');
        this.emitWithState('TopicsSession');
    },
    'AMAZON.RepeatIntent': function () {
        this.response.speak(this.attributes['speechOutput']).listen(this.attributes['repromptText']);
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent': function () {
        this.handler.state = GAME_STATES.HELP;
        this.emitWithState('helpTheUser', false);
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak(this.t('CANCEL_MESSAGE'));
        this.emit(':responseReady');
    },
    'Unhandled': function () {
        let speechOutput = "";
        let responses = ["What you say?", "I don\'t think that is the right answer.", "Please say again."];
        if (this.attributes.STATE == "_GAMEPLAYMODE") {
            var index = Math.floor(Math.random() * responses.length);
            speechOutput = responses[index];
        } else {
            speechOutput = 'Say Help for instruction or Say Cancel or Exit to end game.';
        }
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(':responseReady');
    },
    'SessionEndedRequest': function () {
        console.log(`Session ended in gameplay state: ${this.event.request.reason}`);
    },
});

const helpStateHandlers = Alexa.CreateStateHandler(GAME_STATES.HELP, {
    'helpTheUser': function (newGame) {
        const askMessage = newGame ? this.t('ASK_MESSAGE_START') : this.t('STOP_MESSAGE');
        const speechOutput = this.t('HELP_MESSAGE', GAME_LENGTH) + askMessage;
        const repromptText = this.t('HELP_REPROMPT') + askMessage;

        this.response.speak(speechOutput).listen(repromptText);
        this.emit(':responseReady');
    },
    'AMAZON.StartOverIntent': function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState('StartGame', false);
    },
    'AMAZON.RepeatIntent': function () {
        const newGame = !(this.attributes['speechOutput'] && this.attributes['repromptText']);
        this.emitWithState('helpTheUser', newGame);
    },
    'AMAZON.HelpIntent': function () {
        const newGame = !(this.attributes['speechOutput'] && this.attributes['repromptText']);
        this.emitWithState('helpTheUser', newGame);
    },
    'AMAZON.YesIntent': function () {
        if (this.attributes['speechOutput'] && this.attributes['repromptText']) {
            this.handler.state = GAME_STATES.GAMEPLAY;
            this.emitWithState('AMAZON.RepeatIntent');
        } else {
            this.handler.state = GAME_STATES.GAMEPLAY;
            this.emitWithState('StartGame', false);
        }
    },
    'AMAZON.NoIntent': function () {
        const speechOutput = this.t('NO_MESSAGE');
        this.response.speak(speechOutput);
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        const speechOutput = this.t('STOP_MESSAGE');
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak("Play again next time. Goodbye");
        this.emit(':responseReady');
    },
    'Unhandled': function () {
        const speechOutput = this.t('HELP_UNHANDLED');
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(':responseReady');
    },
    'SessionEndedRequest': function () {
        console.log(`Session ended in help state: ${this.event.request.reason}`);
    },
});

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.resources = languageString;
    alexa.registerHandlers(newSessionHandlers, pickTopicsHandlers, startStateHandlers, gameStateHandlers, helpStateHandlers);
    alexa.execute();
};
