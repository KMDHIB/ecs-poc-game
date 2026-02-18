function getGameOverTitle(): HTMLHeadingElement {
  const gameOverTitle = document.createElement("h1");
  gameOverTitle.textContent = "GAME OVER";
  gameOverTitle.style.cssText = `
    margin: 0;
    font-family: monospace;
    font-size: 48px;
    font-weight: bold;
    color: #ff0000;
    text-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
  `;
  return gameOverTitle;
}

function getFinalScoreElement(score: number): HTMLParagraphElement {
  const finalScore = document.createElement("p");
  finalScore.id = "final-score";
  finalScore.textContent = `Final Score: ${score}`;
  finalScore.style.cssText = `
    margin: 0;
    font-family: monospace;
    font-size: 24px;
    color: #ffffff;
  `;
  return finalScore;
}

function getRestartButton(onRestart: () => void): HTMLButtonElement {
  const restartButton = document.createElement("button");
  restartButton.textContent = "Restart Game";
  restartButton.style.cssText = `
    padding: 15px 40px;
    font-size: 20px;
    font-family: monospace;
    font-weight: bold;
    background-color: #00ff00;
    color: #000;
    border: 3px solid #fff;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 255, 0, 0.5);
    transition: all 0.2s;
  `;
  restartButton.addEventListener("mouseenter", () => {
    restartButton.style.backgroundColor = "#00cc00";
    restartButton.style.transform = "scale(1.05)";
  });
  restartButton.addEventListener("mouseleave", () => {
    restartButton.style.backgroundColor = "#00ff00";
    restartButton.style.transform = "scale(1)";
  });
  restartButton.addEventListener("click", onRestart);
  return restartButton;
}
/**
 * Returns the UI for the game over screen, which includes the final score and a restart button.
 */
export function getGameOverOverlay(
  score: number,
  onRestart: () => void,
): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: absolute;
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 30px;
    background-color: rgba(0, 0, 0, 0.85);
    padding: 50px;
    border-radius: 15px;
    border: 3px solid #fff;
    z-index: 1000;
  `;

  overlay.appendChild(getGameOverTitle());
  overlay.appendChild(getFinalScoreElement(score));
  overlay.appendChild(getRestartButton(onRestart));

  return overlay;
}
