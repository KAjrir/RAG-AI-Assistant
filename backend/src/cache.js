class Cache {
    constructor(defaultTTL = 300_000, cleanupInterval = 60000){
        this.cache = new Map();
        this.defaultTTL = defaultTTL
        this.cleanupInterval = cleanupInterval
        this.cleanupTimer = null;
        this.size = 0;

        this.startCleanup();
    }

    _getSize(value) {
        return new TextEncoder().encode(value).length;
    }

    set(key, value, ttl = this.defaultTTL) {
        const expiresAt = Date.now() + ttl;
        const size = this._getSize(value)
        const existing = this.cache.get(key)
        if (existing) this.size -= existing.size
        this.size += size
        this.cache.set(key, { value, size, expiresAt})
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiresAt) {
            this.delete(key, item.size)
            return null;
        }

        return item.value
    }

    // `size` argument is kept for backwards compatibility but no longer needed
    delete(key) {
        const item = this.cache.get(key)
        if (!item) return false
        this.size -= item.size
        return this.cache.delete(key)
    }

    cleanUp() {
        const now = Date.now();
        
        let cleaned = 0;

        for (const [key, item] of this.cache) {
            if( now > item.expiresAt ) {
                this.delete(key, item.size);
                cleaned++
            }
        }
        
        return cleaned
    }

    startCleanup() {
        if (this.cleanupTimer) return

        this.cleanupTimer = setInterval(() => {
            this.cleanUp()
        }, this.cleanupInterval);

        this.cleanupTimer.unref();
    }

    stopCleanup() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }

    destroy() {
        this.stopCleanup();
        this.cache.clear()
    }
}

export const cache = new Cache();