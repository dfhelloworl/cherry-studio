import EmojiAvatar from '@renderer/components/Avatar/EmojiAvatar'
import { isMac } from '@renderer/config/constant'
import { UserAvatar } from '@renderer/config/env'
import { useTheme } from '@renderer/context/ThemeProvider'
import useAvatar from '@renderer/hooks/useAvatar'
import { useFullscreen } from '@renderer/hooks/useFullscreen'
import { useMinappPopup } from '@renderer/hooks/useMinappPopup'
import { useMinapps } from '@renderer/hooks/useMinapps'
import useNavBackgroundColor from '@renderer/hooks/useNavBackgroundColor'
import { modelGenerating, useRuntime } from '@renderer/hooks/useRuntime'
import { useSettings } from '@renderer/hooks/useSettings'
import { useTokenUsage } from '@renderer/hooks/useTokenUsage'
import { getSidebarIconLabel, getThemeModeLabel } from '@renderer/i18n/label'
import { ThemeMode } from '@renderer/types'
import { isEmoji } from '@renderer/utils'
import { Avatar, Tooltip } from 'antd'
import {
  Code,
  FileSearch,
  Folder,
  Languages,
  LayoutGrid,
  MessageSquare,
  Monitor,
  Moon,
  MousePointerClick,
  NotepadText,
  Palette,
  Settings,
  Sparkle,
  Sun
} from 'lucide-react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { OpenClawSidebarIcon } from '../Icons/SVGIcon'
import UserPopup from '../Popups/UserPopup'
import { SidebarOpenedMinappTabs, SidebarPinnedApps } from './PinnedMinapps'

const Sidebar: FC = () => {
  const { hideMinappPopup } = useMinappPopup()
  const { minappShow } = useRuntime()
  const { sidebarIcons } = useSettings()
  const { pinned } = useMinapps()

  const { pathname } = useLocation()
  const navigate = useNavigate()

  const { theme, settedTheme, toggleTheme } = useTheme()
  const avatar = useAvatar()
  const { t } = useTranslation()

  const onEditUser = () => UserPopup.show()

  const backgroundColor = useNavBackgroundColor()

  const showPinnedApps = pinned.length > 0 && sidebarIcons.visible.includes('minapp')

  const to = async (path: string) => {
    await modelGenerating()
    navigate(path)
  }

  const isFullscreen = useFullscreen()

  return (
    <Container
      $isFullscreen={isFullscreen}
      id="app-sidebar"
      style={{ backgroundColor, zIndex: minappShow ? 10000 : 'initial' }}>
      {isEmoji(avatar) ? (
        <EmojiAvatar onClick={onEditUser} className="sidebar-avatar" size={31} fontSize={18}>
          {avatar}
        </EmojiAvatar>
      ) : (
        <AvatarImg src={avatar || UserAvatar} draggable={false} className="nodrag" onClick={onEditUser} />
      )}
      <MainMenusContainer>
        <Menus onClick={hideMinappPopup}>
          <MainMenus />
        </Menus>
        <SidebarOpenedMinappTabs />
        {showPinnedApps && (
          <AppsContainer>
            <Divider />
            <Menus>
              <SidebarPinnedApps />
            </Menus>
          </AppsContainer>
        )}
      </MainMenusContainer>
      <TokenUsagePanel />
      <Menus>
        <Tooltip title={t('settings.theme.title') + ': ' + getThemeModeLabel(settedTheme)} placement="right">
          <Icon theme={theme} onClick={toggleTheme}>
            {settedTheme === ThemeMode.dark ? (
              <Moon size={20} className="icon" />
            ) : settedTheme === ThemeMode.light ? (
              <Sun size={20} className="icon" />
            ) : (
              <Monitor size={20} className="icon" />
            )}
          </Icon>
        </Tooltip>
        <Tooltip title={t('settings.title')} mouseEnterDelay={0.8} placement="right">
          <StyledLink
            onClick={async () => {
              hideMinappPopup()
              await to('/settings/provider')
            }}>
            <Icon theme={theme} className={pathname.startsWith('/settings') && !minappShow ? 'active' : ''}>
              <Settings size={20} className="icon" />
            </Icon>
          </StyledLink>
        </Tooltip>
      </Menus>
    </Container>
  )
}

const TokenUsagePanel: FC = () => {
  const { usage, loading } = useTokenUsage()
  const { t } = useTranslation()

  if (loading && usage.total_tokens === 0) {
    return null
  }

  return (
    <Tooltip
      title={
        <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
          <div>{t('sidebar.tokenUsage.today')}</div>
          <div style={{ marginTop: '4px' }}>
            {t('sidebar.tokenUsage.input')}: {usage.input_tokens.toLocaleString()}
          </div>
          <div>
            {t('sidebar.tokenUsage.output')}: {usage.output_tokens.toLocaleString()}
          </div>
          <div style={{ marginTop: '4px', fontWeight: 'bold' }}>
            {t('sidebar.tokenUsage.total')}: {usage.total_tokens.toLocaleString()}
          </div>
        </div>
      }
      placement="right">
      <TokenUsageContainer>
        <TokenUsageTitle>{t('sidebar.tokenUsage.title')}</TokenUsageTitle>
        <TokenUsageRow>
          <TokenUsageLabel>{t('sidebar.tokenUsage.inputShort')}</TokenUsageLabel>
          <TokenUsageValue>{usage.input_tokens.toLocaleString()}</TokenUsageValue>
        </TokenUsageRow>
        <TokenUsageRow>
          <TokenUsageLabel>{t('sidebar.tokenUsage.outputShort')}</TokenUsageLabel>
          <TokenUsageValue>{usage.output_tokens.toLocaleString()}</TokenUsageValue>
        </TokenUsageRow>
      </TokenUsageContainer>
    </Tooltip>
  )
}

const MainMenus: FC = () => {
  const { hideMinappPopup } = useMinappPopup()
  const { pathname } = useLocation()
  const { sidebarIcons, defaultPaintingProvider } = useSettings()
  const { minappShow } = useRuntime()
  const navigate = useNavigate()
  const { theme } = useTheme()

  const isRoute = (path: string): string => (pathname === path && !minappShow ? 'active' : '')
  const isRoutes = (path: string): string => (pathname.startsWith(path) && path !== '/' && !minappShow ? 'active' : '')

  const iconMap = {
    assistants: <MessageSquare size={18} className="icon" />,
    agents: <MousePointerClick size={18} className="icon" />,
    store: <Sparkle size={18} className="icon" />,
    paintings: <Palette size={18} className="icon" />,
    translate: <Languages size={18} className="icon" />,
    minapp: <LayoutGrid size={18} className="icon" />,
    knowledge: <FileSearch size={18} className="icon" />,
    files: <Folder size={18} className="icon" />,
    notes: <NotepadText size={18} className="icon" />,
    code_tools: <Code size={18} className="icon" />,
    openclaw: <OpenClawSidebarIcon style={{ width: 18, height: 18 }} className="icon" />
  }

  const pathMap = {
    assistants: '/',
    agents: '/agents',
    store: '/store',
    paintings: `/paintings/${defaultPaintingProvider}`,
    translate: '/translate',
    minapp: '/apps',
    knowledge: '/knowledge',
    files: '/files',
    code_tools: '/code',
    notes: '/notes',
    openclaw: '/openclaw'
  }

  return sidebarIcons.visible.map((icon) => {
    const path = pathMap[icon]
    const isActive = path === '/' ? isRoute(path) : isRoutes(path)

    return (
      <Tooltip key={icon} title={getSidebarIconLabel(icon)} mouseEnterDelay={0.8} placement="right">
        <StyledLink
          onClick={async () => {
            hideMinappPopup()
            await modelGenerating()
            navigate(path)
          }}>
          <Icon theme={theme} className={isActive}>
            {iconMap[icon]}
          </Icon>
        </StyledLink>
      </Tooltip>
    )
  })
}

const Container = styled.div<{ $isFullscreen: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  padding-bottom: 12px;
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  height: ${({ $isFullscreen }) => (isMac && !$isFullscreen ? 'calc(100vh - var(--navbar-height))' : '100vh')};
  -webkit-app-region: drag !important;
  margin-top: ${({ $isFullscreen }) => (isMac && !$isFullscreen ? 'env(titlebar-area-height)' : 0)};

  .sidebar-avatar {
    margin-bottom: ${isMac ? '12px' : '12px'};
    margin-top: ${isMac ? '0px' : '2px'};
    -webkit-app-region: none;
  }
`

const AvatarImg = styled(Avatar)`
  width: 31px;
  height: 31px;
  background-color: var(--color-background-soft);
  margin-bottom: ${isMac ? '12px' : '12px'};
  margin-top: ${isMac ? '0px' : '2px'};
  border: none;
  cursor: pointer;
`

const MainMenusContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
`

const Menus = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
`

const Icon = styled.div<{ theme: string }>`
  width: 35px;
  height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  box-sizing: border-box;
  -webkit-app-region: none;
  border: 0.5px solid transparent;
  .icon {
    color: var(--color-icon);
  }
  &:hover {
    background-color: ${({ theme }) => (theme === 'dark' ? 'var(--color-black)' : 'var(--color-white)')};
    opacity: 0.8;
    cursor: pointer;
    .icon {
      color: var(--color-icon-white);
    }
  }
  &.active {
    background-color: ${({ theme }) => (theme === 'dark' ? 'var(--color-black)' : 'var(--color-white)')};
    border: 0.5px solid var(--color-border);
    .icon {
      color: var(--color-primary);
    }
  }

  @keyframes borderBreath {
    0% {
      opacity: 0.1;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.1;
    }
  }

  &.opened-minapp {
    position: relative;
  }
  &.opened-minapp::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border-radius: inherit;
    opacity: 0.3;
    border: 0.5px solid var(--color-primary);
  }
`

const StyledLink = styled.div`
  text-decoration: none;
  -webkit-app-region: none;
  &* {
    user-select: none;
  }
`

const AppsContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: 10px;
  -webkit-app-region: none;
  &::-webkit-scrollbar {
    display: none;
  }
`

const Divider = styled.div`
  width: 50%;
  margin: 8px 0;
  border-bottom: 0.5px solid var(--color-border);
`

const TokenUsageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 6px;
  margin-bottom: 8px;
  border-radius: 8px;
  background-color: var(--color-background-soft);
  -webkit-app-region: none;
  min-width: calc(var(--sidebar-width) - 16px);
  cursor: pointer;

  &:hover {
    background-color: var(--color-background-mute);
  }
`

const TokenUsageTitle = styled.div`
  font-size: 11px;
  color: var(--color-text-2);
  margin-bottom: 4px;
  font-weight: 500;
`

const TokenUsageRow = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 10px;
  line-height: 1.4;
`

const TokenUsageLabel = styled.span`
  color: var(--color-text-3);
`

const TokenUsageValue = styled.span`
  color: var(--color-text);
  font-weight: 500;
  margin-left: 4px;
`

export default Sidebar
