import { Navbar, NavbarCenter, NavbarLeft, NavbarRight } from '@renderer/components/app/Navbar'
import { HStack } from '@renderer/components/Layout'
import SearchPopup from '@renderer/components/Popups/SearchPopup'
import { modelGenerating } from '@renderer/hooks/useRuntime'
import { useSettings } from '@renderer/hooks/useSettings'
import { useShortcut } from '@renderer/hooks/useShortcuts'
import { useShowAssistants, useShowTopics } from '@renderer/hooks/useStore'
import { useTokenUsage } from '@renderer/hooks/useTokenUsage'
import { useAppDispatch } from '@renderer/store'
import { setNarrowMode } from '@renderer/store/settings'
import type { Assistant, Topic } from '@renderer/types'
import { Tooltip } from 'antd'
import { t } from 'i18next'
import { Menu, PanelLeftClose, PanelRightClose, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { FC } from 'react'
import styled from 'styled-components'

import NavbarIcon from '../../components/NavbarIcon'
import AssistantsDrawer from './components/AssistantsDrawer'
import UpdateAppButton from './components/UpdateAppButton'

interface Props {
  activeAssistant: Assistant
  activeTopic: Topic
  setActiveTopic: (topic: Topic) => void
  setActiveAssistant: (assistant: Assistant) => void
  position: 'left' | 'right'
}

const TokenUsageBadge: FC = () => {
  const { usage } = useTokenUsage()
  const total = usage.input_tokens + usage.output_tokens

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
            {t('sidebar.tokenUsage.total')}: {total.toLocaleString()}
          </div>
        </div>
      }
      placement="bottom">
      <TokenUsageBadgeContainer>
        <TokenUsageBadgeText>{total.toLocaleString()}</TokenUsageBadgeText>
      </TokenUsageBadgeContainer>
    </Tooltip>
  )
}

const HeaderNavbar: FC<Props> = ({ activeAssistant, setActiveAssistant, activeTopic, setActiveTopic }) => {
  const { showAssistants, toggleShowAssistants } = useShowAssistants()
  const { topicPosition, narrowMode } = useSettings()
  const { showTopics, toggleShowTopics } = useShowTopics()
  const dispatch = useAppDispatch()

  useShortcut('search_message', () => {
    void SearchPopup.show()
  })

  const handleNarrowModeToggle = async () => {
    await modelGenerating()
    dispatch(setNarrowMode(!narrowMode))
  }

  const onShowAssistantsDrawer = () => {
    void AssistantsDrawer.show({
      activeAssistant,
      setActiveAssistant,
      activeTopic,
      setActiveTopic
    })
  }

  return (
    <Navbar className="home-navbar">
      <AnimatePresence initial={false}>
        {showAssistants && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden', display: 'flex', flexDirection: 'row' }}>
            <NavbarLeft style={{ justifyContent: 'space-between', borderRight: 'none', padding: 0 }}>
              <Tooltip title={t('navbar.hide_sidebar')} mouseEnterDelay={0.8}>
                <NavbarIcon onClick={toggleShowAssistants}>
                  <PanelLeftClose size={18} />
                </NavbarIcon>
              </Tooltip>
            </NavbarLeft>
          </motion.div>
        )}
      </AnimatePresence>
      {!showAssistants && (
        <NavbarLeft
          style={{
            justifyContent: 'flex-start',
            borderRight: 'none',
            paddingLeft: 0,
            paddingRight: 0,
            minWidth: 'auto'
          }}>
          <Tooltip title={t('navbar.show_sidebar')} mouseEnterDelay={0.8} placement="right">
            <NavbarIcon onClick={() => toggleShowAssistants()}>
              <PanelRightClose size={18} />
            </NavbarIcon>
          </Tooltip>
          <AnimatePresence initial={false}>
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}>
              <NavbarIcon onClick={onShowAssistantsDrawer} style={{ marginLeft: 8 }}>
                <Menu size={18} />
              </NavbarIcon>
            </motion.div>
          </AnimatePresence>
        </NavbarLeft>
      )}
      <NavbarCenter></NavbarCenter>
      <NavbarRight
        style={{
          justifyContent: 'flex-end',
          flex: 1,
          position: 'relative',
          paddingRight: '15px'
        }}
        className="home-navbar-right">
        <HStack alignItems="center" gap={6}>
          <UpdateAppButton />
          <TokenUsageBadge />
          <Tooltip title={t('chat.assistant.search.placeholder')} mouseEnterDelay={0.8}>
            <NarrowIcon onClick={() => SearchPopup.show()}>
              <Search size={18} />
            </NarrowIcon>
          </Tooltip>
          <Tooltip title={t('navbar.expand')} mouseEnterDelay={0.8}>
            <NarrowIcon onClick={handleNarrowModeToggle}>
              <i className="iconfont icon-icon-adaptive-width"></i>
            </NarrowIcon>
          </Tooltip>
          {topicPosition === 'right' && !showTopics && (
            <Tooltip title={t('navbar.show_sidebar')} mouseEnterDelay={2}>
              <NavbarIcon onClick={toggleShowTopics}>
                <PanelLeftClose size={18} />
              </NavbarIcon>
            </Tooltip>
          )}
          {topicPosition === 'right' && showTopics && (
            <Tooltip title={t('navbar.hide_sidebar')} mouseEnterDelay={2}>
              <NavbarIcon onClick={toggleShowTopics}>
                <PanelRightClose size={18} />
              </NavbarIcon>
            </Tooltip>
          )}
        </HStack>
      </NavbarRight>
    </Navbar>
  )
}

const NarrowIcon = styled(NavbarIcon)`
  @media (max-width: 1000px) {
    display: none;
  }
`

const TokenUsageBadgeContainer = styled(NavbarIcon)`
  min-width: 50px;
  padding: 0 10px;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);

  &:hover {
    background-color: var(--color-background-mute);
  }
`

const TokenUsageBadgeText = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
`

export default HeaderNavbar
