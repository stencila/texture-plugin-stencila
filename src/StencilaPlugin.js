import { Texture } from 'substance-texture'

// nodes
import StencilaCell from './nodes/StencilaCell'
import StencilaInlineCell from './nodes/StencilaInlineCell'
import StencilaConfiguration from './nodes/StencilaConfiguration'

// converters
import StencilaArticleJATSImporter from './StencilaArticleJATSImporter'
import StencilaArticleJATSExporter from './StencilaArticleJATSExporter'
import StencilaCellConverter from './StencilaCellConverter'
import StencilaInlineCellConverter from './StencilaInlineCellConverter'
// commands
import InsertCell from './commands/InsertCell'
import InsertInlineCell from './commands/InsertInlineCell'
import RunAllCells from './commands/RunAllCells'
import RunCell from './commands/RunCell'
import RunCellAndAllBefore from './commands/RunCellAndAllBefore'
import RunCellAndAllAfter from './commands/RunCellAndAllAfter'
// components
import CodeEditor from './code-editor/CodeEditor'
import StencilaCellComponent from './components/StencilaCellComponent'
import StencilaInlineCellComponent from './components/StencilaInlineCellComponent'
// services
import StencilaCellService from './StencilaCellService'
import JavascriptRuntimeService from './runtimes/javascript/JavascriptRuntimeService'

const RDS_JATS_PUBLIC_ID = '-//RDS/DTD Stencila Reproducible Documents DTD v1.0'

Texture.registerPlugin({
  name: 'stencila-plugin',
  configure (configurator) {
    let articleConfig = configurator.getConfiguration('article')

    articleConfig.addService(StencilaCellService.id, StencilaCellService.create)
    articleConfig.addService(JavascriptRuntimeService.id, JavascriptRuntimeService.create)
    // TODO register more runtime services, or a universal StencilaRuntimeService

    // let Texture know about a JATS customization used by this plugin
    articleConfig.registerSchemaId(RDS_JATS_PUBLIC_ID)

    // register additional nodes for the internal article document model
    articleConfig.addNode(StencilaCell)
    articleConfig.addNode(StencilaInlineCell)
    articleConfig.addNode(StencilaConfiguration)

    // TODO: we need a way to override existing node schemas, e.g. to allow insertion of a cell into the body
    // for now we HACK into the node's schema
    let Body = articleConfig._nodes.get('body')
    let bodyContentSchema = Body.schema.getProperty('content')
    bodyContentSchema.targetTypes.add(StencilaCell.type)
    let Paragraph = articleConfig._nodes.get('paragraph')
    let paragraphContentSchema = Paragraph.schema.getProperty('content')
    paragraphContentSchema.targetTypes.add(StencilaInlineCell.type)

    // register converters for custom elements
    articleConfig.addConverter(RDS_JATS_PUBLIC_ID, StencilaCellConverter)
    articleConfig.addConverter(RDS_JATS_PUBLIC_ID, StencilaInlineCellConverter)
    articleConfig.addImporter(RDS_JATS_PUBLIC_ID, StencilaArticleJATSImporter, {
      converterGroups: ['jats', RDS_JATS_PUBLIC_ID]
    })
    // register a factory for an exporter
    articleConfig.addExporter(RDS_JATS_PUBLIC_ID, StencilaArticleJATSExporter, {
      converterGroups: ['jats', RDS_JATS_PUBLIC_ID]
    })

    articleConfig.addCommand(InsertCell.id, InsertCell, {
      nodeType: StencilaCell.type,
      commandGroup: 'stencila:insert'
    })
    articleConfig.addCommand(InsertInlineCell.id, InsertInlineCell, {
      nodeType: StencilaInlineCell.type,
      commandGroup: 'stencila:insert'
    })

    articleConfig.addCommand(RunCell.id, RunCell, {
      commandGroup: 'stencila:run:contextual'
    })
    articleConfig.addCommand(RunCellAndAllBefore.id, RunCellAndAllBefore, {
      commandGroup: 'stencila:run:contextual'
    })
    articleConfig.addCommand(RunCellAndAllAfter.id, RunCellAndAllAfter, {
      commandGroup: 'stencila:run:contextual'
    })
    articleConfig.addCommand(RunAllCells.id, RunAllCells, {
      commandGroup: 'stencila:run'
    })

    articleConfig.addComponent('code-editor', CodeEditor)
    articleConfig.addComponent(StencilaCell.type, StencilaCellComponent)
    articleConfig.addComponent(StencilaInlineCell.type, StencilaInlineCellComponent)

    articleConfig.addKeyboardShortcut('CommandOrControl+ENTER', { command: RunCell.id })

    articleConfig.addLabel('stencila:cell', 'Cell')
    articleConfig.addLabel('stencila:cell-menu', 'Cell')
    articleConfig.addLabel('stencila:cell-tools', 'Cell')
    articleConfig.addLabel('stencila:inline-cell', 'Inline Cell')
    articleConfig.addLabel('stencila:insert', 'Insert')
    articleConfig.addLabel('stencila:insert-cell', 'Insert Cell')
    articleConfig.addLabel('stencila:insert-inline-cell', 'Insert Inline Cell')
    articleConfig.addLabel('stencila:run', 'Run')
    articleConfig.addLabel('stencila:run-all-cells', 'Run All Cells')
    articleConfig.addLabel('stencila:run-cell', 'Run Cell')
    articleConfig.addLabel('stencila:run-cell-and-all-after', 'Run Cell and All Below')
    articleConfig.addLabel('stencila:run-cell-and-all-before', 'Run Cell and All Above')
    articleConfig.addLabel('stencila:language', 'Language')
    articleConfig.addLabel('stencila:status:ok', 'ok')
    articleConfig.addLabel('stencila:status:not-evaluated', 'N/A')
    articleConfig.addLabel('stencila:status:error', 'error')
    articleConfig.addLabel('stencila:placeholder:source', 'Enter Source Code')

    articleConfig.addIcon('stencila:expand-code', { 'fontawesome': 'fa-angle-right' })
    articleConfig.addIcon('stencila:collapse-code', { 'fontawesome': 'fa-angle-down' })

    // EXPERIMENTAL: ATM there is no easy way to extend Texture's toolbar et al.
    // for now it needs some understanding of the internal toolpanel layout
    articleConfig.extendToolPanel('toolbar', toolPanelConfig => {
      let cellMenu = {
        name: 'stencila:cell-menu',
        type: 'dropdown',
        style: 'descriptive',
        hideDisabled: false,
        alwaysVisible: true,
        items: [
          {
            type: 'group',
            name: 'stencila:insert',
            style: 'descriptive',
            label: 'stencila:insert',
            items: [
              { type: 'command-group', name: 'stencila:insert' }
            ]
          },
          {
            type: 'group',
            name: 'stencila:run',
            style: 'descriptive',
            label: 'stencila:run',
            items: [
              { type: 'command-group', name: 'stencila:run' },
              { type: 'command-group', name: 'stencila:run:contextual' }
            ]
          }
        ]
      }
      // insert the cellMenu just before the divider
      toolPanelConfig.splice(toolPanelConfig.findIndex(group => group.name === 'divider'), 0, cellMenu)

      // TODO: discuss if we really want to extend Texture's Insert menu
      let insertTools = toolPanelConfig.find(group => group.name === 'insert')
      insertTools.items.find(group => group.name === 'content').items.push({ type: 'command', name: 'stencila:insert-cell', label: 'stencila:cell' })
      insertTools.items.find(group => group.name === 'inline-content').items.push({ type: 'command', name: 'stencila:insert-inline-cell', label: 'stencila:inline-cell' })

      let contextTools = toolPanelConfig.find(group => group.name === 'context-tools')
      contextTools.items.push({
        type: 'group',
        name: 'stencila:cells',
        style: 'descriptive',
        label: 'stencila:cell-tools',
        items: [
          { type: 'command-group', name: 'stencila:run:contextual' }
        ]
      })
    })
    articleConfig.extendToolPanel('context-menu', toolPanelConfig => {
      toolPanelConfig[0].items.push(
        { type: 'command-group', name: 'stencila:run:contextual' }
      )
    })
  }
})
