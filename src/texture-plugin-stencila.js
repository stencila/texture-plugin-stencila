import { Texture } from 'substance-texture'
import CodeEditor from './code-editor/CodeEditor'
import RunCellCommand from './RunCellCommand'
import RunAllCellsCommand from './RunAllCellsCommand'
import StencilaCell from './StencilaCell'
import StencilaCellComponent from './StencilaCellComponent'
import StencilaCellConverter from './StencilaCellConverter'
import StencilaInlineCell from './StencilaInlineCell'
import StencilaInlineCellComponent from './StencilaInlineCellComponent'
import StencilaInlineCellConverter from './StencilaInlineCellConverter'
import StencilaCellService from './StencilaCellService'
import JavascriptRuntimeService from './jsruntime/JavascriptRuntimeService'
import StencilaArticleJATSImporter from './StencilaArticleJATSImporter'
import StencilaArticleJATSExporter from './StencilaArticleJATSExporter'
import InsertCellCommand from './InsertCellCommand'
import InsertInlineCellCommand from './InsertInlineCellCommand'

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
      nodeType: StencilaCell.type
    })
    articleConfig.addCommand(InsertInlineCellCommand.id, InsertInlineCellCommand, {
      nodeType: StencilaInlineCell.type
    })

    articleConfig.addCommand(RunCellCommand.id, RunCellCommand, { commandGroup: 'stencila:cells' })
    articleConfig.addCommand(RunAllCellsCommand.id, RunAllCellsCommand, { commandGroup: 'stencila:cells' })

    articleConfig.addComponent('code-editor', CodeEditor)
    articleConfig.addComponent(StencilaCell.type, StencilaCellComponent)
    articleConfig.addComponent(StencilaInlineCell.type, StencilaInlineCellComponent)

    articleConfig.addKeyboardShortcut('CommandOrControl+ENTER', { command: RunCellCommand.id })

    articleConfig.addLabel('stencila:cell', 'Cell')
    articleConfig.addLabel('stencila:cell-tools', 'Cell')
    articleConfig.addLabel('stencila:inline-cell', 'Inline Cell')
    articleConfig.addLabel('stencila:run-cell', 'Run Cell')
    articleConfig.addLabel('stencila:run-all-cells', 'Run All Cells')
    articleConfig.addLabel('stencila:language', 'Language')
    articleConfig.addLabel('stencila:status:ok', 'ok')
    articleConfig.addLabel('stencila:status:not-evaluated', 'N/A')
    articleConfig.addLabel('stencila:status:error', 'error')
    articleConfig.addLabel('stencila:placeholder:source', 'Enter Source Code')

    articleConfig.addIcon('stencila:expand-code', { 'fontawesome': 'fa-angle-right' })
    articleConfig.addIcon('stencila:collapse-code', { 'fontawesome': 'fa-angle-down' })

    // EXPERIMENTAL: we do not have an easy way to extend the toolbar et al.
    // for now this is needs understanding of the internal toolpanel layout
    // until we understand better what we need
    articleConfig.extendToolPanel('toolbar', toolPanelConfig => {
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
          { type: 'command-group', name: 'stencila:cells' }
        ]
      })
    })
    articleConfig.extendToolPanel('context-menu', toolPanelConfig => {
      toolPanelConfig[0].items.push(
        { type: 'command-group', name: 'stencila:cells' }
      )
    })
  }
})
