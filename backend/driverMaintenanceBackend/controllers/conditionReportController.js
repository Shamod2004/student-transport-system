const ConditionReport = require('../models/ConditionReport')

exports.getAllReports = async (req, res) => {
  try {
    const reports = await ConditionReport.find().populate('bus', 'plateNumber brand model')
    res.json(reports)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.createReport = async (req, res) => {
  try {
    const report = await ConditionReport.create(req.body)
    const populated = await report.populate('bus', 'plateNumber brand model')
    res.status(201).json(populated)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.updateReport = async (req, res) => {
  try {
    const report = await ConditionReport.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('bus', 'plateNumber brand model')
    if (!report) return res.status(404).json({ message: 'Report not found' })
    res.json(report)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.deleteReport = async (req, res) => {
  try {
    const report = await ConditionReport.findByIdAndDelete(req.params.id)
    if (!report) return res.status(404).json({ message: 'Report not found' })
    res.json({ message: 'Report deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
