import GameMechanicsDemo from "@/game/scenes/GameMechanicsDemo";

import SteppingState from "./SteppingState";

import Point from "../points/Point";
import PointMap from "../points/PointMap";
import PointNeighborData from "../points/PointNeighborData";
import PointType from "../points/PointType";

// Scalar to ensure that tweening the Walker from point to point doesn't go too fast.
const walkingDurationScale = 15;

export default class Walker extends Phaser.Physics.Arcade.Image {
    currentVertex: Phaser.Math.Vector2;
    
    mostRecentDestinationId: string;

    remainingSteps: number;

    verticesMap: Map<string, Phaser.Math.Vector2>;
    neighborsMap: Map<string, PointNeighborData[]>;

    steppingState: SteppingState = SteppingState.NotStepping;
    
    currentDestination: PointNeighborData;
    previousDestinations: PointNeighborData[] = [];

    containingScene: GameMechanicsDemo;
    pointMap: PointMap;

    constructor(scene: GameMechanicsDemo, pointMap: PointMap, startCoords: Phaser.Math.Vector2, startCoordsId: string, numSteps: number) {
        super(scene, startCoords.x, startCoords.y, "walker");

        scene.add.existing(this);

        this.currentVertex = startCoords;
        this.mostRecentDestinationId = startCoordsId;

        this.remainingSteps = numSteps;

        this.verticesMap = scene.verticesMap;
        this.neighborsMap = scene.neighborsMap;

        this.containingScene = scene;
        this.pointMap = pointMap;

        // Keeps the Walker on top of everything in the grid, graphically.
        this.setDepth(10);
    }

    _updateRemainingSteps() {
        this.remainingSteps -= 1;
        this.containingScene.stepsText.setText(this.remainingStepsString());
        if (this.remainingSteps <= 0) {
            this.containingScene.stepsText.setColor("red");
            if (this.containingScene.destinatationsArrivedAt < this.containingScene.numDestinations) {
                this.containingScene.destinationsText.setText("Out of steps..");
                this.containingScene.destinationsText.setColor("red");
            }
        }
    }

    getPointById(pointId: string): Point | undefined {
        const findPointResult = this.pointMap.getMatching("pointId", pointId);
        if (findPointResult.length) {
            return findPointResult[0];
        } else {
            return undefined;
        }
    }

    _setOutTweening(destination: PointNeighborData, steppingState: SteppingState) {
        if (this.currentDestination) {
            this.mostRecentDestinationId = this.currentDestination.neighborPointId;
        }
        this.currentDestination = destination;

        this._updateRemainingSteps();
        this.steppingState = steppingState;

        const distanceToDestination = Phaser.Math.Distance.BetweenPoints(this.currentVertex, this.currentDestination.neighborPointCoords);

        this.scene.tweens.add(
            {
                targets: this,
                x: destination.neighborPointCoords.x,
                y: destination.neighborPointCoords.y,
                duration: distanceToDestination * walkingDurationScale,
                onUpdate: function(_: Phaser.Tweens.Tween, target: Walker, key, current) {
                    const updatedVertex = target.currentVertex.clone();
                    if (key === "x") {
                        target.setX(current);
                        updatedVertex.x = current;
                    } else if (key === "y") {
                        target.setY(current);
                        updatedVertex.y = current;
                    }

                    target.currentVertex = updatedVertex;
                },
                onComplete: function(_: Phaser.Tweens.Tween, __: any, target: Walker) {
                    target.steppingState = SteppingState.NotStepping;
                    
                    const destinationPointId = target.currentDestination.neighborPointId
                    const destinationPoint = target.getPointById(destinationPointId);

                    if (destinationPoint) {
                        switch (destinationPoint.pointType) {
                            case PointType.Default:
                                target.handleArrivalAtDefaultPoint();
                                break;
                            case PointType.Destination:
                                target.containingScene.destinationsText.setText("Arrived at destination!");
                                target.containingScene.destinationsText.setColor("green");
                                break;
                            case PointType.Block:
                                target.handleArrivalAtBlockPoint();
                                break;
                            case PointType.Redirect:
                                target.handleArrivalAtRedirectionPoint(destinationPoint.redirectionDestinations[0]);
                                break;
                        }
                    } else {
                        console.log(`Unexpectedly unable to find point ${destinationPointId} in ${target.pointMap}`)
                    }
                }, 
                onCompleteParams: [this]
            }
        )
    }

    takeStep() {
        if (this.steppingState === SteppingState.NotStepping) {
            const mostRecentVertexNeighbors = this.neighborsMap.get(this.mostRecentDestinationId) || [];
            const likelyNextSteps = mostRecentVertexNeighbors.filter(({neighborPointId}) => neighborPointId != this.mostRecentDestinationId);
            
            const nextStep = Phaser.Math.RND.pick(likelyNextSteps);
            this._setOutTweening(nextStep, SteppingState.Walking);
       }
    }

    handleArrivalAtDefaultPoint() {
        if (this.remainingSteps > 0) {
            this.previousDestinations.push(this.currentDestination);
            this.mostRecentDestinationId = this.currentDestination.neighborPointId;
            this.takeStep();
        }
    }

    handleArrivalAtBlockPoint() {
        if (this.remainingSteps > 0 && this.steppingState !== SteppingState.Reversing) {
            const previousDestination = this.previousDestinations.at(-1);

            this.previousDestinations.push(this.currentDestination);
            if (previousDestination) {
                this._setOutTweening(previousDestination, SteppingState.Reversing);
            } else {
                // If !previousDestination, then this is a block from the first step and we have to retrieve the start point.
                const blockNeighbors = this.neighborsMap.get(this.currentDestination.neighborPointId) || [];
                const previousPoint = blockNeighbors.filter(({neighborPointId}) => neighborPointId === this.mostRecentDestinationId)[0];

                if (previousPoint) {
                    this._setOutTweening(previousPoint, SteppingState.Reversing);
                } else {
                    console.log(`Unexpectedly unable to find previous destination ${this.mostRecentDestinationId} from Block ${this.currentDestination.neighborPointId} neighbors ${blockNeighbors}`)
                }
            }
        }
    }

    handleArrivalAtRedirectionPoint(redirectionDestination: PointNeighborData) {
        if (this.remainingSteps > 0) {
            this._setOutTweening(redirectionDestination, SteppingState.Walking);
        }
    }

    remainingStepsString(): string {
        return `Remaining steps: ${this.remainingSteps}`;
    }
}