cmake_minimum_required(VERSION 3.16)
project(command_engine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(command_engine src/command_engine.cpp)

if (MSVC)
  target_compile_options(command_engine PRIVATE /O2 /W4)
else()
  target_compile_options(command_engine PRIVATE -O3 -Wall -Wextra -pedantic)
endif()
