# Rampant on the Tracks - Game Mechanics

This is a demo of Rampant on the Tracks' game mechanics.

There is one Walker and one Destination. The Walker must get to the destination in 25 moves.

The Walker is moving semi-randomly - within the grid, not backtracking

```TypeScript
const maybeNextSteps: NextStep[] = 
    baseStepDirections
        .filter((baseStepDirection) => {
            return !maybePreviousStep || (maybePreviousStep && baseStepDirection !== invertStepDirection(maybePreviousStep))
        })
        .map((likelyNextStep) => {
            const nextStepDestination = this._calculateDirectionNextStep(likelyNextStep);
            return { stepDirection: likelyNextStep, stepDestination: nextStepDestination}
        });
```

The player can further constrain its movements by applying either Blocks

![Block](public/assets/grid_point_blocked.png)

or Redirects

![Redirect North](public/assets//grid_point_redirect_north.png)
![Redirect East](public/assets//grid_point_redirect_east.png)
![Redirect South](public/assets//grid_point_redirect_south.png)
![Redirect West](public/assets//grid_point_redirect_west.png)