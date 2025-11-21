import GameMechanicsDemo from "@/game/scenes/GameMechanicsDemo";

import PointGrid from "@/game/entities/points/PointGrid";

import StepDirection from "./StepDirection";
import NextStep from "./NextStep";
import SteppingState from "./SteppingState";

const baseStepDirections: StepDirection[] = [StepDirection.North, StepDirection.East, StepDirection.South, StepDirection.West];

function invertStepDirection(stepDirection: StepDirection): StepDirection {
    switch(stepDirection) {
        case StepDirection.North: return StepDirection.South;
        case StepDirection.East: return StepDirection.West;
        case StepDirection.South: return StepDirection.North;
        case StepDirection.West: return StepDirection.East;
    }
}

const coordDelta = 0.35;

export default class Walker extends Phaser.Physics.Arcade.Image {
    colRow: Phaser.Math.Vector2;
    currentCoords: Phaser.Math.Vector2;

    remainingSteps: number;

    pointGrid: PointGrid;

    steppingState: SteppingState = SteppingState.NotStepping;
    destinationCoords: Phaser.Math.Vector2;

    previousStepDirections: StepDirection[] = [];
    currentStepDirection: StepDirection;

    _calculateDirectionNextStep(nextStepDirection: StepDirection): Phaser.Math.Vector2 {
        switch(nextStepDirection) {
            case StepDirection.North: return new Phaser.Math.Vector2(this.colRow.x, this.colRow.y - 1);
            case StepDirection.East: return new Phaser.Math.Vector2(this.colRow.x + 1, this.colRow.y);
            case StepDirection.South: return new Phaser.Math.Vector2(this.colRow.x, this.colRow.y + 1);
            case StepDirection.West: return new Phaser.Math.Vector2(this.colRow.x - 1, this.colRow.y);
        }
    }
    _calculateDestinationNextStep(nextStepColRow: Phaser.Math.Vector2): Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2((nextStepColRow.x * this.pointGrid.sceneWidthInterval) + this.pointGrid.pointGridOffset, (nextStepColRow.y * this.pointGrid.sceneHeightInterval) + this.pointGrid.pointGridOffset);
    }

    _calculateDirectionStepCoords(): Phaser.Math.Vector2 {
        switch(this.currentStepDirection) {
            case StepDirection.North: return new Phaser.Math.Vector2(this.currentCoords.x, this.currentCoords.y - coordDelta);
            case StepDirection.East: return new Phaser.Math.Vector2(this.currentCoords.x + coordDelta, this.currentCoords.y);
            case StepDirection.South: return new Phaser.Math.Vector2(this.currentCoords.x, this.currentCoords.y + coordDelta);
            case StepDirection.West: return new Phaser.Math.Vector2(this.currentCoords.x - coordDelta, this.currentCoords.y);
        }
    }

    constructor(scene: GameMechanicsDemo, colRow: Phaser.Math.Vector2, colRowCoords: Phaser.Math.Vector2, numSteps: number) {
        super(scene, colRowCoords.x, colRowCoords.y, "walker");

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.colRow = colRow;
        this.currentCoords = colRowCoords;

        this.remainingSteps = numSteps;

        this.pointGrid = scene.pointGrid;
    }

    preUpdate() {
        if (this.steppingState !== SteppingState.NotStepping) {
            const nextCoords = this._calculateDirectionStepCoords();
            this.setPosition(nextCoords.x, nextCoords.y);
            this.currentCoords = nextCoords;
        }
    }

    _stepDestinationIsWithinGrid(stepDestination: Phaser.Math.Vector2): boolean {
        return stepDestination.x >= 0 && stepDestination.x <= this.pointGrid.colsNum - 1 && stepDestination.y >= 0 && stepDestination.y <= this.pointGrid.rowsNum - 1;
    }

    takeStep() {
        if (this.steppingState === SteppingState.NotStepping) {
            const maybePreviousStep = this.previousStepDirections.at(-1);

            const maybeNextSteps: NextStep[] = 
                baseStepDirections
                    .filter((baseStepDirection) => {
                        return !maybePreviousStep || (maybePreviousStep && baseStepDirection !== invertStepDirection(maybePreviousStep))
                    })
                    .map((likelyNextStep) => {
                        const nextStepDestination = this._calculateDirectionNextStep(likelyNextStep);
                        return { stepDirection: likelyNextStep, stepDestination: nextStepDestination}
                    });

            const likelyNextSteps = 
                Array.from(maybeNextSteps)
                    .filter(({stepDestination}) => {
                        return this._stepDestinationIsWithinGrid(stepDestination);
                    });

            const nextStep = Phaser.Math.RND.pick(likelyNextSteps);
            const { stepDirection: nextStepDir, stepDestination: nextStepDestination } = nextStep;

            const nextStepDestinationCoords = this._calculateDestinationNextStep(nextStepDestination);

            this.currentStepDirection = nextStepDir;
            
            this.colRow = nextStepDestination;
            this.destinationCoords = nextStepDestinationCoords;

            this.remainingSteps -= 1;
            this.steppingState = SteppingState.Walking;
        }
    }

    handleArrivalAtDefaultPoint() {
        this.steppingState = SteppingState.NotStepping;
        if (this.remainingSteps > 0) {
            this.previousStepDirections.push(this.currentStepDirection);
            this.takeStep();
        }
    }

    handleArrivalAtBlockPoint() {
        if (this.remainingSteps > 0 && this.steppingState !== SteppingState.Reversing) {
            this.steppingState = SteppingState.NotStepping;
            this.previousStepDirections.push(this.currentStepDirection);
            
            const reverseDirection = invertStepDirection(this.currentStepDirection);
            const reverseStep = this._calculateDirectionNextStep(reverseDirection);

            const reverseCoords = this._calculateDestinationNextStep(reverseStep);

            this.colRow = reverseStep;
            this.destinationCoords = reverseCoords;

            this.remainingSteps -= 1;
            this.previousStepDirections.push(this.currentStepDirection);

            this.currentStepDirection = reverseDirection;
            
            this.steppingState = SteppingState.Reversing;
        }
    }

    handleArrivalAtDestinationPoint() {
        this.steppingState = SteppingState.NotStepping;
    }

    handleArrivalAtRedirectionPoint(pointDirection: StepDirection) {
        if (this.remainingSteps > 0) {
            const redirectStep = this._calculateDirectionNextStep(pointDirection);

            if (this._stepDestinationIsWithinGrid(redirectStep)) {
                const redirectCoords = this._calculateDestinationNextStep(redirectStep);

                // This will prevent duplicate action on a given Redirect site, but not any action on an immediately following one.
                if (redirectCoords.x !== this.destinationCoords.x || redirectCoords.y !== this.destinationCoords.y) {
                    this.colRow = redirectStep;
                    this.destinationCoords = redirectCoords;

                    this.remainingSteps -= 1;
                    this.previousStepDirections.push(this.currentStepDirection);

                    this.currentStepDirection = pointDirection;
                    this.steppingState = SteppingState.Redirecting;
                }
            }
        }
    }

    remainingStepsString(): string {
        return `Remaining steps: ${this.remainingSteps}`;
    }
}