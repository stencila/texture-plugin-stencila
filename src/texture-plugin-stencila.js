import {
  Texture, ArticleJATSImporter, ArticleJATSExporter
} from 'texture'
import CodeEditor from './code-editor/CodeEditor'
import RunCellCommand from './RunCellCommand'
import RunAllCellsCommand from './RunAllCellsCommand'
import StencilaCell from './StencilaCell'
import StencilaCellComponent from './StencilaCellComponent'
import StencilaCellConverter from './StencilaCellConverter'
import StencilaInlineCell from './StencilaInlineCell'
import StencilaInlineCellComponent from './StencilaInlineCellComponent'
import StencilaInlineCellConverter from './StencilaInlineCellConverter'
import JavascriptContextService from './jscontext/JavascriptContextService'

const RDS_JATS_PUBLIC_ID = '-//RDS/DTD Stencila Reproducible Documents DTD v1.0'

Texture.registerPlugin({
  name: 'stencila-plugin',
  configure (configurator) {
    let articleConfig = configurator.getConfiguration('article')

    articleConfig.addService(JavascriptContextService.id, JavascriptContextService.create)

    // let Texture know about a JATS customization used by this plugin
    articleConfig.registerSchemaId(RDS_JATS_PUBLIC_ID)

    // register additional nodes for the internal article document model
    articleConfig.addNode(StencilaCell)
    articleConfig.addNode(StencilaInlineCell)
    // register converters for custom elements
    articleConfig.addConverter(RDS_JATS_PUBLIC_ID, StencilaCellConverter)
    articleConfig.addConverter(RDS_JATS_PUBLIC_ID, StencilaInlineCellConverter)
    articleConfig.addImporter(RDS_JATS_PUBLIC_ID, ArticleJATSImporter, {
      converterGroups: ['jats', RDS_JATS_PUBLIC_ID]
    })
    // register a factory for an exporter
    articleConfig.addExporter(RDS_JATS_PUBLIC_ID, ArticleJATSExporter, {
      converterGroups: ['jats', RDS_JATS_PUBLIC_ID]
    })
    // add commands and components to the article manuscript configuration
    let articleManuscriptConfig = configurator.getConfiguration('article.manuscript')
    articleManuscriptConfig.addComponent('code-editor', CodeEditor)
    articleManuscriptConfig.addComponent(StencilaCell.type, StencilaCellComponent)
    articleManuscriptConfig.addComponent(StencilaInlineCell.type, StencilaInlineCellComponent)
    // TODO: these commands should only be activated when the doc is a RDS article
    articleManuscriptConfig.addCommand(RunCellCommand.id, RunCellCommand)
    articleManuscriptConfig.addCommand(RunAllCellsCommand.id, RunAllCellsCommand)

    articleManuscriptConfig.addKeyboardShortcut('CommandOrControl+ENTER', { command: RunCellCommand.id })

    articleManuscriptConfig.addLabel('stencila:language', 'Language')
    articleManuscriptConfig.addLabel('stencila:status:ok', 'ok')
    articleManuscriptConfig.addLabel('stencila:status:not-evaluated', 'not evaluated')
    articleManuscriptConfig.addIcon('stencila:expand-code', { 'fontawesome': 'fa-angle-right' })
    articleManuscriptConfig.addIcon('stencila:collapse-code', { 'fontawesome': 'fa-angle-down' })
  }
})
