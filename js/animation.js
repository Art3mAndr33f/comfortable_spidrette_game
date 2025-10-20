export class AnimationManager {
    constructor() {
        this.animations = [];
    }

    animateCardMove(card, targetX, targetY, duration, callback) {
        const startX = card.x;
        const startY = card.y;
        const startTime = performance.now();

        const animation = {
            card,
            startX,
            startY,
            targetX,
            targetY,
            startTime,
            duration,
            callback
        };

        this.animations.push(animation);
    }

    update(timestamp) {
        this.animations = this.animations.filter(anim => {
            const elapsed = timestamp - anim.startTime;
            const progress = Math.min(elapsed / anim.duration, 1);
            
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);

            anim.card.x = anim.startX + (anim.targetX - anim.startX) * eased;
            anim.card.y = anim.startY + (anim.targetY - anim.startY) * eased;

            if (progress >= 1) {
                anim.card.x = anim.targetX;
                anim.card.y = anim.targetY;
                
                if (anim.callback) {
                    anim.callback();
                }
                
                return false;
            }

            return true;
        });
    }

    hasActiveAnimations() {
        return this.animations.length > 0;
    }
}
