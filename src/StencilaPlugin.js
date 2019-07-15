import { Texture } from 'substance-texture'
import CodeEditor from './code-editor/CodeEditor'
import RunCellCommand from './commands/RunCellCommand'
import RunAllCellsCommand from './commands/RunAllCellsCommand'
import StencilaCell from './StencilaCell'
import StencilaCellComponent from './components/StencilaCellComponent'
import StencilaCellConverter from './StencilaCellConverter'
import StencilaInlineCell from './StencilaInlineCell'
import StencilaInlineCellComponent from './components/StencilaInlineCellComponent'
import StencilaInlineCellConverter from './StencilaInlineCellConverter'
import StencilaCellService from './StencilaCellService'
import JavascriptRuntimeService from './jsruntime/JavascriptRuntimeService'
import StencilaArticleJATSImporter from './StencilaArticleJATSImporter'
import StencilaArticleJATSExporter from './StencilaArticleJATSExporter'
import InsertCellCommand from './commands/InsertCellCommand'
import InsertInlineCellCommand from './commands/InsertInlineCellCommand'

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

    articleConfig.addCommand(InsertCellCommand.id, InsertCellCommand, {
      nodeType: StencilaCell.type,
      commandGroup: 'stencila:insert'
    })
    articleConfig.addCommand(InsertInlineCellCommand.id, InsertInlineCellCommand, {
      nodeType: StencilaInlineCell.type,
      commandGroup: 'stencila:insert'
    })

    articleConfig.addCommand(RunCellCommand.id, RunCellCommand, {
      commandGroup: 'stencila:run:contextual'
    })
    articleConfig.addCommand(RunAllCellsCommand.id, RunAllCellsCommand, {
      commandGroup: 'stencila:run'
    })

    articleConfig.addComponent('code-editor', CodeEditor)
    articleConfig.addComponent(StencilaCell.type, StencilaCellComponent)
    articleConfig.addComponent(StencilaInlineCell.type, StencilaInlineCellComponent)

    articleConfig.addKeyboardShortcut('CommandOrControl+ENTER', { command: RunCellCommand.id })

    articleConfig.addLabel('stencila:cell', 'Cell')
    articleConfig.addLabel('stencila:cell-menu', 'Cell')
    articleConfig.addLabel('stencila:cell-tools', 'Cell')
    articleConfig.addLabel('stencila:inline-cell', 'Inline Cell')
    articleConfig.addLabel('stencila:insert', 'Insert')
    articleConfig.addLabel('stencila:insert-cell', 'Insert Cell')
    articleConfig.addLabel('stencila:insert-inline-cell', 'Insert Inline Cell')
    articleConfig.addLabel('stencila:run', 'Run')
    articleConfig.addLabel('stencila:run-cell', 'Run Cell')
    articleConfig.addLabel('stencila:run-all-cells', 'Run All Cells')
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
