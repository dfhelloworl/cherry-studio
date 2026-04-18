import { loggerService } from '@logger'
import { getDataPath } from '@main/utils'
import { IpcChannel } from '@shared/IpcChannel'
import type { BrowserWindow } from 'electron'
import fs from 'fs/promises'
import path from 'path'

const logger = loggerService.withContext('TokenUsageService')

export interface DailyTokenUsage {
  date: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
}

export interface TokenUsageUpdate {
  input_tokens: number
  output_tokens: number
}

class TokenUsageService {
  private static instance: TokenUsageService
  private readonly filePath: string
  private currentUsage: DailyTokenUsage | null = null
  private mainWindow: BrowserWindow | null = null

  private constructor() {
    this.filePath = path.join(getDataPath(), 'token-usage.json')
  }

  public static getInstance(): TokenUsageService {
    if (!TokenUsageService.instance) {
      TokenUsageService.instance = new TokenUsageService()
    }
    return TokenUsageService.instance
  }

  public setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window
  }

  private getTodayString(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  private isSameDay(dateStr: string): boolean {
    return dateStr === this.getTodayString()
  }

  private async loadUsage(): Promise<DailyTokenUsage> {
    if (this.currentUsage && this.isSameDay(this.currentUsage.date)) {
      return this.currentUsage
    }

    try {
      const data = await fs.readFile(this.filePath, 'utf-8')
      const parsed = JSON.parse(data) as DailyTokenUsage

      if (this.isSameDay(parsed.date)) {
        this.currentUsage = parsed
        return parsed
      }

      const newUsage: DailyTokenUsage = {
        date: this.getTodayString(),
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0
      }
      this.currentUsage = newUsage
      await this.saveUsage(newUsage)
      return newUsage
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        const newUsage: DailyTokenUsage = {
          date: this.getTodayString(),
          input_tokens: 0,
          output_tokens: 0,
          total_tokens: 0
        }
        this.currentUsage = newUsage
        await this.saveUsage(newUsage)
        return newUsage
      }

      logger.error('Failed to load token usage:', error as Error)
      const fallbackUsage: DailyTokenUsage = {
        date: this.getTodayString(),
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0
      }
      this.currentUsage = fallbackUsage
      return fallbackUsage
    }
  }

  private async saveUsage(usage: DailyTokenUsage): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true })

      const tempPath = `${this.filePath}.tmp`
      await fs.writeFile(tempPath, JSON.stringify(usage, null, 2))
      await fs.rename(tempPath, this.filePath)

      this.currentUsage = usage
    } catch (error) {
      logger.error('Failed to save token usage:', error as Error)
    }
  }

  private notifyRenderer(usage: DailyTokenUsage): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(IpcChannel.TokenUsage_Updated, usage)
    }
  }

  public async getTodayUsage(): Promise<DailyTokenUsage> {
    return this.loadUsage()
  }

  public async updateUsage(update: TokenUsageUpdate): Promise<DailyTokenUsage> {
    const currentUsage = await this.loadUsage()

    const newUsage: DailyTokenUsage = {
      ...currentUsage,
      input_tokens: currentUsage.input_tokens + update.input_tokens,
      output_tokens: currentUsage.output_tokens + update.output_tokens,
      total_tokens: currentUsage.total_tokens + update.input_tokens + update.output_tokens
    }

    await this.saveUsage(newUsage)
    this.notifyRenderer(newUsage)

    return newUsage
  }

  public async resetTodayUsage(): Promise<DailyTokenUsage> {
    const newUsage: DailyTokenUsage = {
      date: this.getTodayString(),
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0
    }

    await this.saveUsage(newUsage)
    this.notifyRenderer(newUsage)

    return newUsage
  }
}

export const tokenUsageService = TokenUsageService.getInstance()
