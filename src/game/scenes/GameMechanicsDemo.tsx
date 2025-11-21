import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

import Point from '@/game/entities/points/Point';
import PointGrid from '@/game/entities/points/PointGrid';
import PointType from '@/game/entities/points/PointType';
import PointTypeOverride from '@/game/entities/points/PointTypeOverride';

import StepDirection from '@/game/entities/walker/StepDirection';
import Walker from '@/game/entities/walker/Walker';
import SteppingState from '../entities/walker/SteppingState';

const pointsInRow = 8;
const pointsInCol = 8;

const xyOffset = 45;
const numWalkerSteps = 25;

const playerStartColIndex = 2;
const playerStartRowIndex = 5;

const textStyle = {color: "black"};

// This specifies Destinations - it can also help specify unchangeable Redirects (PointGrid refactoring needed for actual unchangability.)
const pointTypeOverrides: PointTypeOverride[] = [
    {
        pointXy: new Phaser.Math.Vector2(5, 2),
        pointType: PointType.Destination
    }
];

export default class GameMechanicsDemo extends Scene
{
    pointGrid: PointGrid;
    walker: Walker;

    stepsText: Phaser.GameObjects.Text;
    destinationsText: Phaser.GameObjects.Text;

    destinatationsArrivedAt: number = 0;
    numDestinations: number;

    constructor () {
        super('GameMechanicsDemo');
    }

    preload() {
        this.load.setPath("assets");

        this.load.image("grid_point", "grid_point.png");
        
        this.load.image("grid_point_blocked", "grid_point_blocked.png");

        this.load.image("grid_point_redirect_north", "grid_point_redirect_north.png");
        this.load.image("grid_point_redirect_east", "grid_point_redirect_east.png");
        this.load.image("grid_point_redirect_south", "grid_point_redirect_south.png");
        this.load.image("grid_point_redirect_west", "grid_point_redirect_west.png");

        this.load.image("walker", "walker.png");
        this.load.image("walker_destination", "walker_destination.png");
    }

    _determineWalkerOverlapWithDestination(walker: Walker): boolean {
        const walkerPosition = walker.currentCoords;
        const walkerDestination = walker.destinationCoords;
        
        // Overlap = complete overlap. 
        switch(walker.currentStepDirection) {
            case StepDirection.North: return walkerPosition.y <= walkerDestination.y;
            case StepDirection.East: return walkerPosition.x >= walkerDestination.x;
            case StepDirection.South: return walkerPosition.y >= walkerDestination.y;
            case StepDirection.West: return walkerPosition.x <= walkerDestination.x;
        }
    }

    create() {
        this.pointGrid = new PointGrid(this.physics.world, this, pointsInCol, pointsInRow, xyOffset, pointTypeOverrides);

        const colRowVector = new Phaser.Math.Vector2(playerStartColIndex, playerStartRowIndex);
        const colRowCoordsVector = new Phaser.Math.Vector2((playerStartColIndex * this.pointGrid.sceneWidthInterval) + xyOffset, (playerStartRowIndex * this.pointGrid.sceneHeightInterval) + xyOffset);

        this.walker = new Walker(this, colRowVector, colRowCoordsVector, numWalkerSteps);

        this.numDestinations = pointTypeOverrides.filter(({pointType}) => pointType === PointType.Destination).length;

        this.physics.add.overlap(this.walker, this.pointGrid, (walker, point) => {
            const castWalker = walker as Walker;
            const castPoint = point as Point;

            this.stepsText.setText(castWalker.remainingStepsString());
            if (castWalker.remainingSteps <= 0) {
                this.stepsText.setColor("red");
                if (this.destinatationsArrivedAt < this.numDestinations) {
                    this.destinationsText.setText("Out of steps..");
                    this.destinationsText.setColor("red");
                }
            }

            switch(castPoint.pointType) {
                case PointType.Default:
                    if (this._determineWalkerOverlapWithDestination(castWalker)) {
                        castWalker.handleArrivalAtDefaultPoint();
                    }
                    break;
                case PointType.Destination:
                    if (castWalker.steppingState !== SteppingState.NotStepping) {
                        if (this._determineWalkerOverlapWithDestination(castWalker)) {
                            this.destinationsText.setText("Arrived at destination!");
                            this.destinationsText.setColor("green");
                            
                            castWalker.handleArrivalAtDestinationPoint();
                        }
                    }
                    break;
                case PointType.Block:
                    // No overlap because we want the Walker to bounce off the Block.
                    castWalker.handleArrivalAtBlockPoint();
                    break;
                case PointType.RedirectNorth:
                    if (this._determineWalkerOverlapWithDestination(castWalker)) {
                        castWalker.handleArrivalAtRedirectionPoint(StepDirection.North);
                    }
                    break;
                case PointType.RedirectEast:
                    if (this._determineWalkerOverlapWithDestination(castWalker)) {
                        castWalker.handleArrivalAtRedirectionPoint(StepDirection.East);
                    }
                    break;
                case PointType.RedirectSouth:
                    if (this._determineWalkerOverlapWithDestination(castWalker)) {
                        castWalker.handleArrivalAtRedirectionPoint(StepDirection.South);
                    }
                    break;
                case PointType.RedirectWest:
                    if (this._determineWalkerOverlapWithDestination(castWalker)) {
                        castWalker.handleArrivalAtRedirectionPoint(StepDirection.West);
                    }
                    break;
            }
        });

        this.stepsText = this.add.text(0, 0, this.walker.remainingStepsString(), textStyle);
        this.destinationsText = this.add.text(0, 15, "Walking towards destination..", textStyle);

        this.walker.takeStep();

        EventBus.emit('current-scene-ready', this);
    }
}
