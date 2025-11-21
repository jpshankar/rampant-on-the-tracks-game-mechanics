import GameMechanicsDemo from './scenes/GameMechanicsDemo';
import { AUTO, Game, Types } from "phaser";

const config: Types.Core.GameConfig = {
    type: AUTO,
    width: 600,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#ffffff',
    scene: [
        GameMechanicsDemo
    ],
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
}

export default StartGame;
