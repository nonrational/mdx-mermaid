/**
 * Copyright (c) Samuel Wall.
 *
 * This source code is licensed under the MIT license found in the
 * license file in the root directory of this source tree.
 */

import React, { useEffect, useState, ReactElement } from 'react'
import mermaid from 'mermaid'
import mermaidAPI from 'mermaid/mermaidAPI'

import { Config } from './config.model'
import { getTheme, DARK_THEME_KEY, LIGHT_THEME_KEY } from './theme.helper'

/**
 * Assign a unique ID to each mermaid svg as per requirements
 * of `mermaid.render`.
 */
let id = 0

/**
 * Properties for Mermaid component.
 */
export type MermaidProps = {
  /**
   * Mermaid diagram.
   */
  chart: string

  /**
   * Config to initialize mermaid with.
   */
  config?: Config
}

const SvgOpenExternal = ({ theme, svg }): ReactElement => {
  const iconSize = "16"
  const fillColor = DARK_THEME_KEY === theme ? '#FFF' : '#000'

  const openSvgInWindow = () => {
    if (!svg) return

    const svgBlob = new Blob([svg], { type: "image/svg+xml" })
    const url = URL.createObjectURL(svgBlob);
    return window.open(url)
  }

  return (
    <div className='mermaid-svg-opener' onClick={openSvgInWindow} style={{ position: 'relative', height: `${iconSize}px`, cursor: 'pointer' }}>
      <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width={iconSize} height={iconSize} preserveAspectRatio="xMidYMid meet" viewBox="0 0 1792 1536" style={{ position: 'absolute', right: 0 }}>
        <path fill={fillColor} d="M1408 928v320q0 119-84.5 203.5T1120 1536H288q-119 0-203.5-84.5T0 1248V416q0-119 84.5-203.5T288 128h704q14 0 23 9t9 23v64q0 14-9 23t-23 9H288q-66 0-113 47t-47 113v832q0 66 47 113t113 47h832q66 0 113-47t47-113V928q0-14 9-23t23-9h64q14 0 23 9t9 23zm384-864v512q0 26-19 45t-45 19t-45-19l-176-176l-652 652q-10 10-23 10t-23-10L695 983q-10-10-10-23t10-23l652-652l-176-176q-19-19-19-45t19-45t45-19h512q26 0 45 19t19 45z"/>
      </svg>
    </div>
  )
}

/**
 * Component to display Mermaid diagrams.
 *
 * @param param0 Diagram to display.
 * @param param1 Config.
 * @returns The component.
 */
export const Mermaid = ({ chart, config }: MermaidProps): ReactElement<MermaidProps> => {
  // Due to Docusaurus not correctly parsing client-side from server-side modules, use the provided workaround
  // found in the accompanying issue: https://github.com/facebook/docusaurus/issues/4268#issuecomment-783553084
  /* istanbul ignore next */
  if (typeof window === 'undefined') {
    return <div></div>
  }

  const html: HTMLHtmlElement = document.querySelector('html')!

  // Watch for changes in theme in the HTML attribute `data-theme`.
  const [theme, setTheme] = useState<mermaidAPI.Theme>(getTheme(html, config))

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== 'attributes' || mutation.attributeName !== 'data-theme') {
          continue
        }
        setTheme(getTheme(mutation.target as HTMLHtmlElement, config))
        break
      }
    })

    observer.observe(html, { attributes: true })
    return () => {
      try {
        observer.disconnect()
      } catch {
        // Do nothing
      }
    }
  }, [chart, config, theme])

  // When theme updates, rerender the SVG.
  const [svg, setSvg] = useState<string>('')

  useEffect(() => {
    const render = () => {
      mermaid.render(`mermaid-svg-${id.toString()}`, chart, (renderedSvg) => setSvg(renderedSvg))
      id++
    }

    if (config) {
      if (config.mermaid) {
        mermaid.initialize({ startOnLoad: true, ...config.mermaid, theme })
      } else {
        mermaid.initialize({ startOnLoad: true, theme })
      }
      render()
    } else {
      // Is there a better way?
      setTimeout(render, 0)
    }
  }, [theme, chart])

  return (
    <div className='mermaid-svg-wrapper'>
      {config?.showOpenLink && <SvgOpenExternal svg={svg} theme={theme} />}
      <div className='mermaid-svg-container' dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  )
}
