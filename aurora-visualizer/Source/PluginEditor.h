#pragma once
#include <juce_opengl/juce_opengl.h>
#include <juce_dsp/juce_dsp.h>
#include "PluginProcessor.h"

class AuroraEditor : public juce::AudioProcessorEditor,
                     private juce::OpenGLRenderer
{
public:
    explicit AuroraEditor (AuroraProcessor&);
    ~AuroraEditor() override;

    void paint (juce::Graphics&) override {}
    void resized() override;
    void mouseDoubleClick (const juce::MouseEvent&) override;

private:
    // OpenGLRenderer (thread de rendu GL)
    void newOpenGLContextCreated() override;
    void renderOpenGL() override;
    void openGLContextClosing() override;

    void analyse();   // FIFO -> FFT -> bandes lissées
    void buildShader();

    static constexpr int fftOrder = 11;              // 2048 points
    static constexpr int fftSize  = 1 << fftOrder;
    static constexpr int numBands = 64;

    AuroraProcessor& processor;
    juce::OpenGLContext glContext;

    // Analyse
    juce::dsp::FFT fft { fftOrder };
    juce::dsp::WindowingFunction<float> window { (size_t) fftSize, juce::dsp::WindowingFunction<float>::hann };
    std::array<float, fftSize> ring {};            // dernières fftSize valeurs (ordre chronologique après copie)
    std::array<float, fftSize * 2> fftBuf {};
    std::array<float, numBands> bands {};          // 0..1, lissées
    float bass = 0, mid = 0, high = 0, level = 0;
    std::array<float, 4096> scratch {};

    // GL
    std::unique_ptr<juce::OpenGLShaderProgram> shader;
    GLuint vao = 0, vbo = 0;
    std::unique_ptr<juce::OpenGLShaderProgram::Uniform> uRes, uTime, uSpec, uBass, uMid, uHigh, uLevel, uPalette, uStars;
    double startTime = 0.0, lastTime = 0.0;
    float animTime = 0.0f;

    // Contrôles (bandeau affiché par double-clic)
    juce::Slider sens, smooth, speed, stars;
    juce::Label sensL, smoothL, speedL, starsL;
    juce::ComboBox palette;
    using SA = juce::AudioProcessorValueTreeState::SliderAttachment;
    using CA = juce::AudioProcessorValueTreeState::ComboBoxAttachment;
    std::unique_ptr<SA> sensA, smoothA, speedA, starsA;
    std::unique_ptr<CA> paletteA;
    void setupSlider (juce::Slider&, juce::Label&, const juce::String& text);

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (AuroraEditor)
};
