import { memo, useEffect, useRef } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { Signal, useSignal } from '@preact/signals-react'
import { convertFileSrc, invoke } from '@tauri-apps/api/tauri'
import NoWrapIcon from '~/assets/icons/nowrap'
import WrapIcon from '~/assets/icons/wrap'
import NotFoundImage from '~/assets/images/image-not-found.png'
import NoImage from '~/assets/images/no-image.png'
import { isEmailNotUrl } from '~/libs/utils'
import { formatLocale as format } from '~/locales/date-locales'
import { timeAgoInstance } from '~/locales/locales'
import clsx from 'clsx'
import { Dot, Link } from 'lucide-react'
import { Highlight, themes } from 'prism-react-renderer'
import { useTranslation } from 'react-i18next'

import { ensureUrlPrefix } from '~/lib/utils'

import ImageWithFallback from '~/components/atoms/image/image-with-fallback-on-error'
import LinkCardTrackOnly from '~/components/atoms/link-card/link-card-track'
import PlayButton from '~/components/atoms/play-button/PlayButton'
import ToolTip from '~/components/atoms/tooltip'
import { CardValueViewer } from '~/components/card-value-viewer'
import { CodeViewerMemo } from '~/components/code-viewer'
import { Box, Flex } from '~/components/ui'

import { useGetLinkMetadataByItemId } from '~/hooks/queries/use-items'

import { highlightMatchedText, hyperlinkText } from '../../helpers'
import { CardContent } from './BaseCard'
import { ClipWebRequestOptions } from './ClipCard'
import { ClipViewForm } from './ClipViewForm'
import { ClipViewTemplate } from './ClipViewTemplate'
import { getValuePreview } from './utils'

type ClipCardBodyProps = {
  arrLinks?: string[]
  clipId?: UniqueIdentifier
  detectedLanguage?: string | null
  hasEmoji?: boolean
  hasMaskedWords?: boolean
  imageDataUrl?: string | null
  imageHash?: string | null
  imagePathFullRes?: string | null
  imageScale?: number
  imageType?: string | null
  clipName?: string | null
  imageWidthHeight?: string | null
  isCode?: boolean
  isCommand?: boolean
  isWebRequest?: boolean
  isWebScraping?: boolean
  isExpanded: Signal
  isImage?: boolean
  isImageData?: boolean
  isLargeView?: boolean
  isLink?: boolean
  isMasked?: boolean
  isPath?: boolean
  isForm?: boolean
  isTemplate?: boolean
  isVideo?: boolean
  isMenu?: boolean
  isShowLinkedClip?: boolean
  isCopyOrPaste?: boolean
  formTemplateOptions?: string | null
  commandRequestOutput?: string | null
  isCommandRequestRunError?: boolean
  commandRequestOutputLastRunAt?: number | null
  requestOptions?: string | null
  itemOptions?: string | null
  isDark: boolean
  pathType?: string | null
  searchTerm: string
  value?: string | undefined
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export function ClipCardBody({
  arrLinks = [],
  clipId,
  isShowLinkedClip,
  detectedLanguage,
  hasEmoji,
  hasMaskedWords,
  imageDataUrl,
  imageHash,
  imagePathFullRes,
  imageScale,
  imageType,
  imageWidthHeight,
  isCode,
  isCommand,
  isWebRequest,
  isWebScraping,
  isExpanded,
  isImage,
  isImageData,
  isLargeView,
  isLink,
  isForm,
  isTemplate,
  isMasked,
  isPath,
  isVideo,
  isMenu,
  isCopyOrPaste,
  isDark,
  clipName,
  formTemplateOptions,
  commandRequestOutput,
  isCommandRequestRunError,
  commandRequestOutputLastRunAt,
  requestOptions,
  pathType,
  searchTerm,
  value = '',
}: ClipCardBodyProps) {
  const { t } = useTranslation()
  const isBrokenImage = useSignal(false)
  const isWrapText = useSignal(false)
  const pathTypeCheck = useSignal<string | null | undefined>('')
  const scollToRef = useRef<HTMLDivElement>(null)

  const { metadataLinkByItemId } = useGetLinkMetadataByItemId(isLink || isPath, clipId)

  const hasLinkCard =
    (isLink &&
      Boolean(metadataLinkByItemId?.linkTitle && metadataLinkByItemId?.linkDomain)) ||
    (isPath && Boolean(metadataLinkByItemId?.linkIsTrack))

  const webrequestLocalOptions = useSignal<ClipWebRequestOptions>({
    method: 'GET',
    headers: [],
    body: '',
    scrapingRules: [],
    filters: [],
    auth: {},
  })

  const { valuePreview, morePreviewLines, morePreviewChars } = getValuePreview(
    value,
    isImage || isImageData,
    isLargeView ||
      isLink ||
      isPath ||
      isCommand ||
      isWebRequest ||
      isWebScraping ||
      isForm ||
      isTemplate
  )

  useEffect(() => {
    if (requestOptions) {
      try {
        const options = JSON.parse(requestOptions)
        webrequestLocalOptions.value = {
          ...webrequestLocalOptions.value,
          ...options,
        }
      } catch (e) {}
    }
  }, [requestOptions])

  const textValue: string = value || ''

  useEffect(() => {
    if (isExpanded.value) {
      isWrapText.value = false
    }
  }, [isExpanded.value])

  useEffect(() => {
    if (isPath) {
      invoke('check_path', { path: textValue })
        .then(() => {
          pathTypeCheck.value = pathType
        })
        .catch(() => {
          pathTypeCheck.value = 'Error'
        })
    }
  }, [isPath])

  useEffect(() => {
    if (searchTerm) {
      isExpanded.value = true
    }
  }, [searchTerm])

  const imageMaxHeight = isLargeView ? 'max-h-[600px]' : 'max-h-[300px]'
  const isEmptyBody = textValue.length === 0
  const isMp3 = isLink && textValue?.endsWith('.mp3')

  useEffect(() => {
    if (isShowLinkedClip) {
      scollToRef?.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      })
    }
  }, [isShowLinkedClip, scollToRef?.current])

  return (
    <CardContent
      className={clsx(
        isCopyOrPaste
          ? 'bg-green-50 dark:bg-green-900/40'
          : 'bg-white/80 dark:bg-slate-900/80',
        'px-2 pr-1.5 py-1 mb-0.5 mx-1 text-left flex flex-col rounded-md select-auto relative'
      )}
    >
      <Box className="mb-0.5" ref={scollToRef}>
        {isPath ? (
          <>
            {hasLinkCard && (
              <LinkCardTrackOnly
                itemId={clipId}
                trackTitle={metadataLinkByItemId?.linkTrackTitle}
                trackArtist={metadataLinkByItemId?.linkTrackArtist}
                trackAlbum={metadataLinkByItemId?.linkTrackAlbum}
              />
            )}
            <Highlight
              theme={isDark ? themes.vsDark : themes.github}
              code={textValue}
              language={'path'}
            >
              {({ className, style, tokens, getLineProps, getTokenProps }) => {
                return (
                  <code
                    className={`${className} ${
                      pathTypeCheck.value === 'Error'
                        ? ' line-through decoration-gray-300'
                        : ''
                    }`}
                    style={style}
                  >
                    {tokens.map((line, i) => {
                      return (
                        <div
                          key={i}
                          {...getLineProps({ line })}
                          className="overflow-hidden text-ellipsis whitespace-pre-wrap"
                        >
                          {line.map((token, key) => (
                            <span
                              key={key}
                              {...getTokenProps({ token })}
                              className={`${
                                pathTypeCheck.value === 'Error' ? 'opacity-60' : ''
                              } select-text`}
                            >
                              {!searchTerm
                                ? token.content
                                : highlightMatchedText(token.content, searchTerm)}
                            </span>
                          ))}
                        </div>
                      )
                    })}
                  </code>
                )
              }}
            </Highlight>
          </>
        ) : isImageData ? (
          <Box className="text-ellipsis self-start text-xs overflow-hidden select-none">
            <Box className="flex px-0 py-1 items-center justify-center">
              <ImageWithFallback
                src={textValue}
                hasError={isBrokenImage.value}
                onErrorCallback={() => {
                  isBrokenImage.value = true
                }}
                draggable={false}
                decoding="async"
                className={`${imageMaxHeight} min-h-10`}
              />
            </Box>
            <code className="pb-0.5">{valuePreview}</code>
          </Box>
        ) : isLink && isImage ? (
          <Box className="text-ellipsis self-start text-xs overflow-hidden select-none">
            <Box className="flex px-0 pt-1.5 pb-0.5 items-center justify-center">
              <ImageWithFallback
                src={ensureUrlPrefix(textValue)}
                hasError={isBrokenImage.value}
                onErrorCallback={() => {
                  isBrokenImage.value = true
                }}
                draggable={false}
                decoding="async"
                className={`${imageMaxHeight} min-h-10`}
              />
            </Box>
            <code className="pb-0.5">{hyperlinkText(textValue, arrLinks)}</code>
          </Box>
        ) : isImage ? (
          <Box className="px-0 py-1.5 flex items-center justify-center relative animate-in fade-in duration-300 !fill-mode-forwards select-none">
            {isLargeView ? (
              <img
                decoding="async"
                srcSet={
                  imagePathFullRes && imageDataUrl
                    ? `${convertFileSrc(imagePathFullRes)}?${imageHash} ${imageScale}x`
                    : !imageDataUrl && !imagePathFullRes
                      ? NoImage
                      : NotFoundImage
                }
                key={clipId}
                src={
                  imagePathFullRes && imageDataUrl
                    ? `${convertFileSrc(imagePathFullRes)}?${imageHash}`
                    : !imageDataUrl && !imagePathFullRes
                      ? NoImage
                      : NotFoundImage
                }
                className="rounded-md shadow-sm border border-slate-100 dark:border-slate-600 object-scale-down"
              />
            ) : (
              <img
                src={
                  imagePathFullRes && (imageType === 'webp' || imageType === 'gif')
                    ? `${convertFileSrc(imagePathFullRes)}?${imageHash}`
                    : imageDataUrl && imagePathFullRes
                      ? imageDataUrl
                      : !imageDataUrl && !imagePathFullRes
                        ? NoImage
                        : NotFoundImage
                }
                draggable={false}
                decoding="async"
                height="auto"
                className="max-h-56 min-h-10 rounded-md shadow-sm border border-slate-100 dark:border-slate-600"
              />
            )}
            <Box className="absolute left-0 bottom-1 flex flex-row gap-1 rounded items-center pb-0.5 pl-0.5">
              <Box
                className="text-xs text-muted-foreground bg-slate-50 dark:bg-slate-950 px-1.5 rounded transform duration-300"
                title={t('Image size in pixels', { ns: 'common' })}
              >
                {imageWidthHeight} {imageType}
              </Box>
            </Box>
          </Box>
        ) : detectedLanguage && isCode && valuePreview ? (
          <Box className="text-ellipsis self-start text-sm w-full select-text">
            <CodeViewerMemo
              isDark={isDark}
              searchTerm={searchTerm}
              isLargeView={isLargeView}
              isShowMore={isExpanded.value || morePreviewLines == null}
              isWrapped={isWrapText.value}
              value={isExpanded.value ? textValue : valuePreview}
              language={detectedLanguage}
            />
          </Box>
        ) : isCommand && valuePreview ? (
          <Box className="text-ellipsis self-start text-sm w-full select-text pt-0.5">
            <CodeViewerMemo
              isDark={isDark}
              searchTerm={searchTerm}
              isLargeView={isLargeView}
              isCommand={true}
              isShowMore={true}
              isWrapped={isWrapText.value}
              autoHideScrollbar={true}
              value={textValue}
              language="shell"
            />
            {commandRequestOutput && (
              <Box
                className={`${
                  isCommandRequestRunError
                    ? 'bg-red-50 dark:bg-red-950'
                    : 'bg-green-50 dark:bg-green-950'
                } py-1 rounded-md px-3 mb-1 relative border-0`}
              >
                <CodeViewerMemo
                  isDark={isDark}
                  maxHeight={!isLargeView ? 100 : 150}
                  isLargeView={false}
                  isShowMore={true}
                  isWrapped={isWrapText.value}
                  value={commandRequestOutput}
                  language="shell"
                />

                {commandRequestOutputLastRunAt && (
                  <Box className="text-xs text-muted-foreground rounded px-1 bg-slate-50 dark:bg-slate-900/80 absolute bottom-1 right-1">
                    <ToolTip
                      text={`${t('Last run', { ns: 'dashboard' })}: ${format(
                        commandRequestOutputLastRunAt,
                        'PPpp'
                      )}`}
                      className="text-xs bg-slate-50 dark:bg-slate-900 text-center"
                      maxWidth={300}
                      isCompact
                      side="bottom"
                      sideOffset={10}
                    >
                      {timeAgoInstance().format(
                        commandRequestOutputLastRunAt,
                        'mini-minute-now',
                        {
                          round: 'floor',
                        }
                      )}
                    </ToolTip>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        ) : (isWebRequest || isWebScraping) && valuePreview ? (
          <Box className="text-ellipsis self-start text-sm w-full select-text pt-0.5">
            <CodeViewerMemo
              isDark={isDark}
              searchTerm={searchTerm}
              isLargeView={isLargeView}
              isShowMore={true}
              isWrapped={isWrapText.value}
              value={textValue}
              autoHideScrollbar={true}
              webRequestMethod={
                isWebRequest ? webrequestLocalOptions.value.method : 'URL'
              }
              language="shell"
            />
            {commandRequestOutput && (
              <Box
                className={`${
                  isCommandRequestRunError
                    ? 'bg-red-50 border-red-100'
                    : 'bg-green-50 border-green-100'
                } ${isLargeView ? 'py-1' : 'py-0'} rounded-md px-3 relative mb-1 border`}
              >
                <CodeViewerMemo
                  isDark={isDark}
                  maxHeight={!isLargeView ? 100 : 150}
                  isLargeView={false}
                  isShowMore={true}
                  isWrapped={isWrapText.value}
                  value={commandRequestOutput}
                  language={isCommandRequestRunError ? 'text' : 'json'}
                />

                {commandRequestOutputLastRunAt && (
                  <Box className="text-xs text-muted-foreground rounded px-1 bg-slate-50 dark:bg-slate-900/80 absolute bottom-1 right-1">
                    <ToolTip
                      text={`${t('Last run', { ns: 'dashboard' })}: ${format(
                        commandRequestOutputLastRunAt,
                        'PPpp'
                      )}`}
                      className="text-xs bg-slate-50 dark:bg-slate-900 text-center"
                      maxWidth={300}
                      isCompact
                      side="bottom"
                      sideOffset={10}
                    >
                      {timeAgoInstance().format(
                        commandRequestOutputLastRunAt,
                        'mini-minute-now',
                        {
                          round: 'floor',
                        }
                      )}
                    </ToolTip>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        ) : isForm ? (
          <Box className="self-start text-sm w-full select-text">
            <ClipViewForm formTemplateOptions={formTemplateOptions} clipId={clipId} />
          </Box>
        ) : isTemplate ? (
          <Box className="self-start text-sm w-full select-text">
            <ClipViewTemplate
              formTemplateOptions={formTemplateOptions}
              clipId={clipId}
              value={value}
            />
          </Box>
        ) : isEmptyBody ? (
          <code className="text-gray-300">{clipName}</code>
        ) : (
          <CardValueViewer
            isExpanded={isExpanded.value}
            isWrapped={isWrapText.value ?? false}
            isImageData={isImageData}
            isMasked={isMasked}
            isLargeView={isLargeView}
            itemId={clipId}
            isCode={isCode}
            isLink={isLink}
            isPath={isPath}
            isVideo={isVideo}
            hasLinkCard={hasLinkCard}
            metadataLinkByItemId={metadataLinkByItemId}
            isImage={isImage}
            textValue={textValue}
            valuePreview={valuePreview}
            morePreviewLines={morePreviewLines}
            isDark={isDark}
            searchTerm={searchTerm}
          />
        )}
      </Box>
      <Flex className="justify-between select-none">
        {(!(isWebRequest || isCommand || isWebScraping) && commandRequestOutput) ||
        isLargeView ? (
          <Box className="flex flex-row items-center rounded">
            <Box
              className="text-xs text-muted-foreground px-1.5 transform duration-300 cursor-pointer"
              onClick={() => {
                isWrapText.value = !isWrapText.value
              }}
            >
              <ToolTip
                text={
                  !isWrapText.value
                    ? t('Lines Wrap', { ns: 'common' })
                    : t('No Wrap', { ns: 'common' })
                }
                delayDuration={2000}
                isCompact
                side="bottom"
                sideOffset={10}
              >
                {!isWrapText.value ? (
                  <WrapIcon width={20} height={20} />
                ) : (
                  <NoWrapIcon width={20} height={20} />
                )}
              </ToolTip>
            </Box>
          </Box>
        ) : morePreviewLines || morePreviewChars ? (
          <Box className="flex flex-row items-center rounded">
            <Box
              className="text-xs text-muted-foreground px-0 transform duration-300 cursor-pointer"
              onClick={() => {
                isExpanded.value = !isExpanded.value
              }}
            >
              <ToolTip
                text={!isExpanded.value ? t('Show all', { ns: 'common' }) : ''}
                isCompact
                isDisabled={isExpanded.value}
                delayDuration={2000}
                side="bottom"
                sideOffset={10}
              >
                {!isExpanded.value ? (
                  morePreviewChars ? (
                    <>
                      +{morePreviewChars} {t('chars', { ns: 'common' })}
                    </>
                  ) : (
                    morePreviewLines && (
                      <>
                        +{morePreviewLines} {t('lines', { ns: 'common' })}
                      </>
                    )
                  )
                ) : (
                  <>- {t('show less', { ns: 'common' })}</>
                )}
              </ToolTip>
            </Box>

            <Box
              className="text-xs text-muted-foreground px-1.5 transform duration-300 cursor-pointer"
              onClick={() => {
                isWrapText.value = !isWrapText.value
              }}
            >
              <ToolTip
                text={
                  !isWrapText.value
                    ? t('Lines Wrap', { ns: 'common' })
                    : t('No Wrap', { ns: 'common' })
                }
                delayDuration={2000}
                isCompact
                side="bottom"
                sideOffset={10}
              >
                {!isWrapText.value ? (
                  <WrapIcon width={20} height={20} />
                ) : (
                  <NoWrapIcon width={20} height={20} />
                )}
              </ToolTip>
            </Box>
          </Box>
        ) : isMp3 ? (
          <PlayButton
            src={textValue}
            isPinnedBoard={false}
            isClip={true}
            id={clipId}
            type="clip"
          />
        ) : (
          <Box />
        )}

        <Box className={`flex flex-row gap-1 items-center justify-end `}>
          {isCommand && (
            <Box
              className={`${
                isCommandRequestRunError
                  ? 'bg-red-300 dark:bg-red-800 dark:text-slate-300 text-red-800'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
              } text-xs rounded-sm px-1.5`}
            >
              {isCommandRequestRunError
                ? t('Command error', { ns: 'dashboard' })
                : t('Type:::Command', { ns: 'dashboard' })}
            </Box>
          )}

          {(isWebRequest || isWebScraping) && (
            <Flex className="gap-1">
              <Box
                className={`${
                  isCommandRequestRunError
                    ? 'bg-red-300 dark:bg-red-600 dark:text-red-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
                } text-xs rounded-sm px-1.5`}
              >
                {isWebRequest && (
                  <span>
                    {isCommandRequestRunError
                      ? t('Request error', { ns: 'dashboard' })
                      : t('Type:::Request', { ns: 'dashboard' })}
                  </span>
                )}
                {isWebScraping && (
                  <span>
                    {isCommandRequestRunError
                      ? t('Error', { ns: 'dashboard' })
                      : t('Type:::Scraper', { ns: 'dashboard' })}
                  </span>
                )}
              </Box>
              {isWebScraping &&
                webrequestLocalOptions.value.scrapingRules &&
                webrequestLocalOptions.value.scrapingRules?.filter(h => h.isEnable)
                  .length > 0 && (
                  <Box className="bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5">
                    {t('Headers', { ns: 'dashboard' })}
                    <span className="ml-1 font-mono">
                      {
                        webrequestLocalOptions.value.headers.filter(h => h.isEnable)
                          .length
                      }
                    </span>
                  </Box>
                )}
              {isWebRequest &&
                webrequestLocalOptions.value.headers.filter(h => h.isEnable).length >
                  0 && (
                  <Box className="bg-slate-300 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5">
                    {t('Headers', { ns: 'dashboard' })}
                    <span className="ml-1 font-mono">
                      {
                        webrequestLocalOptions.value.headers.filter(h => h.isEnable)
                          .length
                      }
                    </span>
                  </Box>
                )}
              {isWebRequest && webrequestLocalOptions.value.auth?.isEnable && (
                <Box className="bg-slate-300 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5">
                  {webrequestLocalOptions.value.auth?.type}
                </Box>
              )}
              {isWebRequest &&
                webrequestLocalOptions.value.filters.filter(h => h.isEnable).length >
                  0 && (
                  <Box className="bg-slate-300 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5">
                    {t('Filters', { ns: 'dashboard' })}
                    <span className="ml-1 font-mono">
                      {
                        webrequestLocalOptions.value.filters.filter(h => h.isEnable)
                          .length
                      }
                    </span>
                  </Box>
                )}
            </Flex>
          )}

          {(isMasked || hasMaskedWords) && (
            <Box
              className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm ${
                hasMaskedWords ? 'px-0.5' : 'px-1.5'
              }`}
            >
              {isMasked ? t('Type:::Secret', { ns: 'common' }) : <Dot size={16} />}
            </Box>
          )}

          {detectedLanguage && (
            <Box
              className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5`}
            >
              {detectedLanguage}
            </Box>
          )}
          {isLink && (
            <Box
              className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5`}
            >
              {isVideo
                ? t('Type:::Video', { ns: 'common' })
                : isEmailNotUrl(textValue)
                  ? t('Type:::Email', { ns: 'common' })
                  : isMp3
                    ? t('Type:::Mp3', { ns: 'common' })
                    : t('Type:::Link', { ns: 'common' })}
            </Box>
          )}
          {isPath && pathTypeCheck.value && (
            <Box
              className={`${
                pathTypeCheck.value === 'Error'
                  ? 'bg-red-300'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
              } text-xs rounded-sm px-1.5`}
            >
              {pathTypeCheck.value === 'Error' ? (
                <ToolTip
                  text={t('File, folder or app path does not exist', {
                    ns: 'dashboard',
                  })}
                  className="text-red-500 bg-red-50 text-center"
                  maxWidth={300}
                  isCompact
                  side="bottom"
                  sideOffset={10}
                >
                  {pathTypeCheck.value}
                </ToolTip>
              ) : (
                pathTypeCheck.value
              )}
            </Box>
          )}
          {hasEmoji && (
            <Box
              className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5`}
            >
              {t('Type:::Emoji', { ns: 'common' })}
            </Box>
          )}
          {isEmptyBody && !isForm && !isImage && (
            <Box
              className={`bg-yellow-200 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-400 text-xs rounded-sm px-1.5`}
            >
              {t('Type:::Empty', { ns: 'common' })}
            </Box>
          )}
          {isImageData && (
            <Box
              className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5`}
            >
              {t('Type:::Image Base64', { ns: 'common' })}
            </Box>
          )}
          {isForm && (
            <Box
              className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5`}
            >
              {t('Type:::Auto Fill', { ns: 'common' })}
            </Box>
          )}
          {isMenu && (
            <Flex
              className={`bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 text-xs rounded-sm px-1.5`}
            >
              {t('Type:::Menu', { ns: 'common' })}
              <Link size={11} className="ml-1" />
            </Flex>
          )}
        </Box>
      </Flex>
    </CardContent>
  )
}

export const ClipCardBodyMemoized = memo(ClipCardBody)
